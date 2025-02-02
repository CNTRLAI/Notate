import sys
import os
import subprocess
import asyncio
from concurrent.futures import ThreadPoolExecutor, as_completed
import warnings
import logging

# Filter transformers model warnings
warnings.filterwarnings('ignore', category=UserWarning)
os.environ['TRANSFORMERS_NO_ADVISORY_WARNINGS'] = 'true'

# Configure logging to handle progress messages
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def find_python310():
    python_commands = ["python3.12", "python3"] if sys.platform != "win32" else [
        "python3.11", "py -3.11", "python"]

    for cmd in python_commands:
        try:
            result = subprocess.run(
                [cmd, "--version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if sys.platform == "win32":
                if "Python 3.11" in result.stdout:
                    return cmd
            else:
                if "Python 3.12" in result.stdout:
                    return cmd
        except:
            continue
    return None


def create_venv(venv_path=None):
    if venv_path is None:
        venv_path = os.path.join(os.path.dirname(__file__), 'venv')
    if not os.path.exists(venv_path):
        print("Creating virtual environment...")
        python310 = find_python310()
        if not python310:
            if sys.platform == "win32":
                raise RuntimeError(
                    "Python 3.11 is required but not found. Please install Python 3.11.")
            else:
                raise RuntimeError(
                    "Python 3.12 is required but not found. Please install Python 3.12.")

        subprocess.check_call([python310, "-m", "venv", venv_path])
        print(f"Created virtual environment with {python310}")
    return venv_path


def get_venv_python(venv_path):
    if sys.platform == "win32":
        return os.path.join(venv_path, "Scripts", "python.exe")
    return os.path.join(venv_path, "bin", "python")


def install_package(python_path, package):
    try:
        subprocess.check_call(
            [python_path, '-m', 'pip', 'install', '--no-deps',
                '--upgrade-strategy', 'only-if-needed', package],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        return package, None
    except subprocess.CalledProcessError as e:
        return package, str(e)


def get_installed_packages(python_path):
    result = subprocess.run(
        [python_path, '-m', 'pip', 'list', '--format=freeze'],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    return {line.split('==')[0].lower(): line.split('==')[1] for line in result.stdout.splitlines()}


async def async_init_store():
    try:
        # Suppress model initialization warnings
        import transformers
        from src.vectorstorage.init_store import init_store
        transformers.logging.set_verbosity_error()
        logging.getLogger(
            "transformers.modeling_utils").setLevel(logging.ERROR)

        # Configure huggingface_hub logging
        hf_logger = logging.getLogger("huggingface_hub")
        hf_logger.setLevel(logging.INFO)
        sys.stdout.write(
            "Downloading initial embedding model (HIT-TMG/KaLM-embedding-multilingual-mini-instruct-v1.5) ...|85\n")
        sys.stdout.flush()

        # Redirect stderr to capture progress messages
        with open(os.devnull, 'w') as devnull:
            old_stderr = sys.stderr
            sys.stderr = devnull
            try:
                model_path = await init_store()
                sys.stdout.write(
                    f"Model downloaded successfully to {model_path}|95\n")
            finally:
                sys.stderr = old_stderr

        sys.stdout.flush()
    except Exception as e:
        sys.stdout.write(f"Error downloading model: {str(e)}|85\n")
        sys.stdout.flush()
        raise e


def get_package_version(python_path, package_name):
    try:
        result = subprocess.run(
            [python_path, '-m', 'pip', 'show', package_name],
            capture_output=True,
            text=True
        )
        for line in result.stdout.split('\n'):
            if line.startswith('Version: '):
                version = line.split('Version: ')[1].strip()
                # Handle CUDA variants of PyTorch
                if package_name == 'torch' and '+cu' in version:
                    # Strip CUDA suffix for version comparison
                    version = version.split('+')[0]
                return version
    except:
        return None
    return None


def install_requirements(custom_venv_path=None):
    try:
        venv_path = create_venv(custom_venv_path)
        python_path = get_venv_python(venv_path)

        # Install core dependencies first

        requirements_path = os.path.join(
            os.path.dirname(__file__), 'requirements.txt')

        # Handle remaining requirements
        with open(requirements_path, 'r') as f:
            requirements = [
                line.strip() for line in f
                if line.strip()
                and not line.startswith('#')
            ]

        total_deps = len(requirements)
        sys.stdout.write(f"Total packages to process: {total_deps}|50\n")
        sys.stdout.flush()

        installed_packages = get_installed_packages(python_path)

        to_install = []
        for req in requirements:
            pkg_name = req.split('==')[0] if '==' in req else req
            if pkg_name.lower() not in installed_packages:
                to_install.append(req)

        completed_deps = total_deps - len(to_install)
        progress = 50 + (completed_deps / total_deps) * \
            30  # Scale from 50 to 80
        sys.stdout.write(f"Checked installed packages|{progress:.1f}\n")
        sys.stdout.flush()

        with ThreadPoolExecutor(max_workers=5) as executor:
            future_to_pkg = {executor.submit(
                install_package, python_path, req): req for req in to_install}
            for future in as_completed(future_to_pkg):
                pkg = future_to_pkg[future]
                pkg_name = pkg.split('==')[0] if '==' in pkg else pkg
                result, error = future.result()
                completed_deps += 1
                progress = 50 + (completed_deps / total_deps) * \
                    30  # Scale from 50 to 80

                if error:
                    sys.stdout.write(
                        f"Error installing {pkg_name}: {error}|{progress:.1f}\n")
                else:
                    sys.stdout.write(f"Installed {pkg_name}|{progress:.1f}\n")
                sys.stdout.flush()

        # Now we can safely import init_store after all dependencies are installed
        sys.stdout.write(
            "All dependencies installed, initializing model store...|85\n")
        sys.stdout.flush()

        # Initialize the store to download the model
        asyncio.run(async_init_store())

        sys.stdout.write(
            "Dependencies installed and model initialized successfully!|99\n")
        sys.stdout.flush()

    except Exception as e:
        sys.stdout.write(f"Error installing dependencies: {str(e)}|0\n")
        sys.stdout.flush()
        sys.exit(1)


if __name__ == "__main__":
    custom_venv_path = sys.argv[1] if len(sys.argv) > 1 else None
    install_requirements(custom_venv_path)
