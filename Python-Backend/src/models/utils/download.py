import os
import logging
import requests
from tqdm import tqdm
from pathlib import Path
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

def download_file_with_progress(url: str, file_path: Path, headers: Optional[Dict[str, str]] = None) -> None:
    """Download a file with progress bar"""
    try:
        response = requests.get(url, stream=True, headers=headers or {})
        response.raise_for_status()

        total_size = int(response.headers.get('content-length', 0))
        block_size = 8192  # 8 KB

        with open(file_path, 'wb') as f, tqdm(
            desc=file_path.name,
            total=total_size,
            unit='iB',
            unit_scale=True,
            unit_divisor=1024,
        ) as pbar:
            for data in response.iter_content(block_size):
                size = f.write(data)
                pbar.update(size)

        logger.info(f"Successfully downloaded {file_path.name}")
    except Exception as e:
        if file_path.exists() and file_path.stat().st_size == 0:
            file_path.unlink()  # Remove empty/partial file
        raise ValueError(f"Failed to download file {file_path.name}: {str(e)}")

def get_hf_repo_files(repo_id: str, hf_token: Optional[str] = None) -> List[Dict]:
    """Get list of files in a HuggingFace repository"""
    api_url = f"https://huggingface.co/api/models/{repo_id}/tree/main"
    headers = {"Accept": "application/json"}
    if hf_token:
        headers["Authorization"] = f"Bearer {hf_token}"
        logger.info("Using provided HuggingFace token")

    logger.info(f"Fetching repository contents from {api_url}")
    response = requests.get(api_url, headers=headers)
    response.raise_for_status()
    return response.json()

def download_hf_model_files(repo_id: str, model_path: Path, required_files: List[str], hf_token: Optional[str] = None) -> None:
    """Download required files from a HuggingFace repository"""
    try:
        files = get_hf_repo_files(repo_id, hf_token)
        logger.info(f"Found {len(files)} files in repository")
        logger.info(f"Required files: {required_files}")

        headers = {}
        if hf_token:
            headers["Authorization"] = f"Bearer {hf_token}"

        for file_name in required_files:
            file_info = next((f for f in files if f['path'] == file_name), None)
            if not file_info:
                logger.error(f"Required file {file_name} not found in repository. Available files: {[f['path'] for f in files]}")
                raise ValueError(f"Required file {file_name} not found in repository {repo_id}")

            download_url = f"https://huggingface.co/{repo_id}/resolve/main/{file_name}"
            file_path = model_path / file_name

            logger.info(f"Downloading {file_name} ({file_info.get('size', 'unknown size')}) from {download_url}")
            download_file_with_progress(download_url, file_path, headers)

    except Exception as e:
        logger.error(f"Failed to download model: {str(e)}", exc_info=True)
        # Clean up any partially downloaded files
        if model_path.exists():
            import shutil
            shutil.rmtree(model_path)
        raise ValueError(f"Failed to download model: {str(e)}")

def find_best_gguf_file(files: List[Dict]) -> Optional[Dict]:
    """Find the best GGUF file from a list of files, preferring q4_k_m files and sorting by size"""
    gguf_files = [f for f in files if f.get('path', '').endswith('.gguf')]
    if not gguf_files:
        return None

    # Sort by preference for q4_k_m files and then by size
    gguf_files.sort(key=lambda x: (
        0 if 'q4_k_m' in x['path'].lower() else 1,
        x.get('size', float('inf'))
    ))
    return gguf_files[0]

def download_gguf_model(repo_id: str, model_path: Path, hf_token: Optional[str] = None) -> Path:
    """Download a GGUF model from HuggingFace"""
    try:
        files = get_hf_repo_files(repo_id, hf_token)
        file_info = find_best_gguf_file(files)
        if not file_info:
            raise ValueError(f"No GGUF files found in repository {repo_id}")

        file_name = file_info['path']
        download_url = f"https://huggingface.co/{repo_id}/resolve/main/{file_name}"
        model_path = model_path / file_name

        # Only download if file doesn't exist or is empty
        if not model_path.exists() or model_path.stat().st_size == 0:
            headers = {"Authorization": f"Bearer {hf_token}"} if hf_token else {}
            download_file_with_progress(download_url, model_path, headers)

        return model_path
    except Exception as e:
        if model_path.exists() and model_path.stat().st_size == 0:
            model_path.unlink()
        raise ValueError(f"Failed to download GGUF model: {str(e)}")
