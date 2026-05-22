from pathlib import Path

IGNORE_DIRS = {
    ".git", ".venv", "venv", "env", "node_modules", ".next",
    "__pycache__", ".pytest_cache", ".mypy_cache", "dist", "build"
}

def print_folder_tree(path, prefix="", max_depth=None, current_depth=0):
    path = Path(path)

    if max_depth is not None and current_depth > max_depth:
        return

    if not path.exists():
        print(f"Path not found: {path}")
        return

    folders = sorted(
        [p for p in path.iterdir() if p.is_dir() and p.name not in IGNORE_DIRS],
        key=lambda p: p.name.lower()
    )

    for index, folder in enumerate(folders):
        connector = "└── " if index == len(folders) - 1 else "├── "
        print(prefix + connector + folder.name)

        extension = "    " if index == len(folders) - 1 else "│   "
        print_folder_tree(
            folder,
            prefix + extension,
            max_depth=max_depth,
            current_depth=current_depth + 1
        )

if __name__ == "__main__":
    folder_path = input("Enter folder path: ").strip().strip('"')

    root = Path(folder_path)
    print(root.name)
    print_folder_tree(root, max_depth=5)
