import subprocess
import tempfile
import os
import re
import time
import shutil
from typing import Optional
from app.schemas.submission import CodeRunRequest, CodeRunResponse

# Configurable execution timeout — override via EXECUTION_TIMEOUT_SECONDS env var
EXECUTION_TIMEOUT = int(os.environ.get("EXECUTION_TIMEOUT_SECONDS", "5"))
COMPILE_TIMEOUT = int(os.environ.get("COMPILE_TIMEOUT_SECONDS", "10"))


class ExecutionService:
    """Real Sandboxed Execution Engine.
    Attempts execution via Docker isolated container if Docker daemon is running.
    Falls back to local compiler execution (Python, GCC, G++, JDK) if Docker is unavailable.
    Infrastructure failures are NEVER reported as student code errors.
    """

    def _is_docker_daemon_running(self) -> bool:
        """Returns True only if Docker CLI is available AND daemon is reachable."""
        if not shutil.which("docker"):
            return False
        try:
            result = subprocess.run(
                ["docker", "info"],
                capture_output=True,
                timeout=2,
            )
            return result.returncode == 0
        except Exception:
            return False

    def _detect_java_class_name(self, code: str) -> str:
        """Extract the public class name from Java code. Falls back to 'Solution'."""
        match = re.search(r"public\s+class\s+(\w+)", code)
        return match.group(1) if match else "Solution"

    def execute_code(self, req: CodeRunRequest, expected_output: Optional[str] = None) -> CodeRunResponse:
        lang = req.language.strip()
        code = req.source_code.strip()
        user_input = req.input if req.input is not None else ""
        if user_input and not user_input.endswith("\n"):
            user_input += "\n"

        start_time = time.time()

        # Route to Docker only if daemon is verified to be running
        if self._is_docker_daemon_running():
            docker_res = self._execute_in_docker(lang, code, user_input, start_time)
            if docker_res is not None:
                return docker_res

        # Fall back to native compiler (Python, GCC, G++, JDK)
        return self._execute_native(lang, code, user_input, start_time)

    def _execute_in_docker(self, lang: str, code: str, user_input: str, start_time: float) -> Optional[CodeRunResponse]:
        """Runs student code inside an isolated ephemeral Docker container with network disabled."""
        DAEMON_ERROR_STRINGS = ["cannot connect to the docker daemon", "error during connect", "is the docker daemon running"]

        with tempfile.TemporaryDirectory() as tmpdir:
            try:
                if lang in ["Python", "Python 3", "python"]:
                    filepath = os.path.join(tmpdir, "solution.py")
                    with open(filepath, "w", encoding="utf-8") as f:
                        f.write(code)

                    docker_cmd = [
                        "docker", "run", "--rm",
                        "--network", "none",
                        "--memory", "128m",
                        "--cpus", "0.5",
                        "--pids-limit", "64",
                        "--no-new-privileges",
                        "-v", f"{tmpdir}:/workspace",
                        "-w", "/workspace",
                        "python:3.11-slim",
                        "python3", "solution.py"
                    ]

                elif lang in ["C++", "cpp", "c++"]:
                    filepath = os.path.join(tmpdir, "solution.cpp")
                    with open(filepath, "w", encoding="utf-8") as f:
                        f.write(code)

                    docker_cmd = [
                        "docker", "run", "--rm",
                        "--network", "none",
                        "--memory", "256m",
                        "--cpus", "0.5",
                        "--pids-limit", "64",
                        "--no-new-privileges",
                        "-v", f"{tmpdir}:/workspace",
                        "-w", "/workspace",
                        "gcc:latest",
                        "sh", "-c", "g++ -O2 solution.cpp -o solution.out && ./solution.out"
                    ]

                elif lang in ["C", "c"]:
                    filepath = os.path.join(tmpdir, "solution.c")
                    with open(filepath, "w", encoding="utf-8") as f:
                        f.write(code)

                    docker_cmd = [
                        "docker", "run", "--rm",
                        "--network", "none",
                        "--memory", "256m",
                        "--cpus", "0.5",
                        "--pids-limit", "64",
                        "--no-new-privileges",
                        "-v", f"{tmpdir}:/workspace",
                        "-w", "/workspace",
                        "gcc:latest",
                        "sh", "-c", "gcc -O2 solution.c -o solution.out && ./solution.out"
                    ]

                elif lang in ["Java", "java"]:
                    class_name = self._detect_java_class_name(code)
                    filepath = os.path.join(tmpdir, f"{class_name}.java")
                    with open(filepath, "w", encoding="utf-8") as f:
                        f.write(code)

                    docker_cmd = [
                        "docker", "run", "--rm",
                        "--network", "none",
                        "--memory", "256m",
                        "--cpus", "0.5",
                        "--pids-limit", "64",
                        "--no-new-privileges",
                        "-v", f"{tmpdir}:/workspace",
                        "-w", "/workspace",
                        "openjdk:17-slim",
                        "sh", "-c", f"javac {class_name}.java && java {class_name}"
                    ]

                else:
                    return None

                proc = subprocess.run(
                    docker_cmd,
                    input=user_input,
                    capture_output=True,
                    text=True,
                    timeout=EXECUTION_TIMEOUT
                )

                elapsed = f"{round(time.time() - start_time, 3)}s"

                # Check if Docker daemon error crept through despite our pre-check
                combined_err = (proc.stderr or "").lower()
                if any(s in combined_err for s in DAEMON_ERROR_STRINGS):
                    return None  # Fall through to native execution

                if proc.returncode != 0:
                    stderr_lower = (proc.stderr or "").lower()
                    is_compile_err = ("error:" in stderr_lower or "error:" in stderr_lower or
                                      "javac" in proc.stderr or "gcc" in proc.stderr or "g++" in proc.stderr)
                    status_lbl = "Compilation Error" if is_compile_err else "Runtime Error"
                    return CodeRunResponse(
                        status=status_lbl,
                        stdout=proc.stdout.strip(),
                        stderr=proc.stderr.strip(),
                        execution_time=elapsed,
                        error=status_lbl.replace(" ", ""),
                    )

                return CodeRunResponse(
                    status="Success",
                    stdout=proc.stdout.strip(),
                    stderr=proc.stderr.strip(),
                    execution_time=elapsed,
                    error=None,
                )

            except subprocess.TimeoutExpired:
                return CodeRunResponse(
                    status="Time Limit Exceeded",
                    stdout="",
                    stderr=f"Execution timed out ({EXECUTION_TIMEOUT}s limit exceeded)",
                    execution_time=f"{EXECUTION_TIMEOUT}.00s",
                    error="TimeoutExpired",
                )
            except Exception:
                # Docker call failed for any reason — fall through to native
                return None

    def _execute_native(self, lang: str, code: str, user_input: str, start_time: float) -> CodeRunResponse:
        """Executes student code using installed system compilers (Python 3, GCC, G++, JDK).
        Reports distinct 'Infrastructure Error' status if a required compiler is missing."""
        with tempfile.TemporaryDirectory() as tmpdir:
            try:
                if lang in ["Python", "Python 3", "python"]:
                    if not shutil.which("python3"):
                        return CodeRunResponse(
                            status="Infrastructure Error",
                            stdout="",
                            stderr="Python 3 runtime is unavailable on this server.",
                            execution_time="0.00s",
                            error="InfrastructureError",
                        )
                    filepath = os.path.join(tmpdir, "solution.py")
                    with open(filepath, "w", encoding="utf-8") as f:
                        f.write(code)
                    cmd = ["python3", filepath]

                elif lang in ["C++", "cpp", "c++"]:
                    if not shutil.which("g++"):
                        return CodeRunResponse(
                            status="Infrastructure Error",
                            stdout="",
                            stderr="C++ compiler (g++) is unavailable on this server.",
                            execution_time="0.00s",
                            error="InfrastructureError",
                        )
                    srcpath = os.path.join(tmpdir, "solution.cpp")
                    outpath = os.path.join(tmpdir, "solution.out")
                    with open(srcpath, "w", encoding="utf-8") as f:
                        f.write(code)

                    compile_proc = subprocess.run(
                        ["g++", "-O2", srcpath, "-o", outpath],
                        capture_output=True, text=True, timeout=COMPILE_TIMEOUT
                    )
                    if compile_proc.returncode != 0:
                        return CodeRunResponse(
                            status="Compilation Error",
                            stdout="",
                            stderr=compile_proc.stderr.strip(),
                            execution_time=f"{round(time.time() - start_time, 3)}s",
                            error="CompilationError",
                        )
                    cmd = [outpath]

                elif lang in ["C", "c"]:
                    if not shutil.which("gcc"):
                        return CodeRunResponse(
                            status="Infrastructure Error",
                            stdout="",
                            stderr="C compiler (gcc) is unavailable on this server.",
                            execution_time="0.00s",
                            error="InfrastructureError",
                        )
                    srcpath = os.path.join(tmpdir, "solution.c")
                    outpath = os.path.join(tmpdir, "solution.out")
                    with open(srcpath, "w", encoding="utf-8") as f:
                        f.write(code)

                    compile_proc = subprocess.run(
                        ["gcc", "-O2", srcpath, "-o", outpath],
                        capture_output=True, text=True, timeout=COMPILE_TIMEOUT
                    )
                    if compile_proc.returncode != 0:
                        return CodeRunResponse(
                            status="Compilation Error",
                            stdout="",
                            stderr=compile_proc.stderr.strip(),
                            execution_time=f"{round(time.time() - start_time, 3)}s",
                            error="CompilationError",
                        )
                    cmd = [outpath]

                elif lang in ["Java", "java"]:
                    if not shutil.which("javac"):
                        return CodeRunResponse(
                            status="Infrastructure Error",
                            stdout="",
                            stderr="Java compiler (javac) is unavailable on this server.",
                            execution_time="0.00s",
                            error="InfrastructureError",
                        )
                    # Detect class name from code to name file correctly
                    class_name = self._detect_java_class_name(code)
                    srcpath = os.path.join(tmpdir, f"{class_name}.java")
                    with open(srcpath, "w", encoding="utf-8") as f:
                        f.write(code)

                    compile_proc = subprocess.run(
                        ["javac", srcpath],
                        capture_output=True, text=True, timeout=COMPILE_TIMEOUT
                    )
                    if compile_proc.returncode != 0:
                        return CodeRunResponse(
                            status="Compilation Error",
                            stdout="",
                            stderr=compile_proc.stderr.strip(),
                            execution_time=f"{round(time.time() - start_time, 3)}s",
                            error="CompilationError",
                        )
                    cmd = ["java", "-cp", tmpdir, class_name]

                else:
                    return CodeRunResponse(
                        status="Error",
                        stdout="",
                        stderr=f"Unsupported language: {lang}",
                        execution_time="0.00s",
                        error="UnsupportedLanguage",
                    )

                run_proc = subprocess.run(
                    cmd,
                    input=user_input,
                    capture_output=True,
                    text=True,
                    timeout=EXECUTION_TIMEOUT
                )
                elapsed = f"{round(time.time() - start_time, 3)}s"

                if run_proc.returncode != 0:
                    return CodeRunResponse(
                        status="Runtime Error",
                        stdout=run_proc.stdout.strip(),
                        stderr=run_proc.stderr.strip(),
                        execution_time=elapsed,
                        error="RuntimeError",
                    )

                return CodeRunResponse(
                    status="Success",
                    stdout=run_proc.stdout.strip(),
                    stderr=run_proc.stderr.strip(),
                    execution_time=elapsed,
                    error=None,
                )

            except subprocess.TimeoutExpired:
                return CodeRunResponse(
                    status="Time Limit Exceeded",
                    stdout="",
                    stderr=f"Execution timed out ({EXECUTION_TIMEOUT}s limit exceeded)",
                    execution_time=f"{EXECUTION_TIMEOUT}.00s",
                    error="TimeoutExpired",
                )
            except Exception as e:
                return CodeRunResponse(
                    status="Execution Error",
                    stdout="",
                    stderr=str(e),
                    execution_time="0.00s",
                    error="ExecutionError",
                )
