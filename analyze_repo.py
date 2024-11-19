import requests


def fetch_contents(repo_owner, repo_name, path=''):
    url = f"https://api.github.com/repos/{repo_owner}/{repo_name}/contents/{path}"
    headers = {
        'Accept': 'application/vnd.github.v3+json',
        # 'Authorization': 'token YOUR_GITHUB_TOKEN'  # Uncomment and add your GitHub token if needed
    }
    response = requests.get(url, headers=headers)
    response.raise_for_status()
    return response.json()


def print_structure(contents, indent=0):
    for item in contents:
        print('  ' * indent + item['name'])
        if item['type'] == 'dir':
            sub_contents = fetch_contents(repo_owner, repo_name, item['path'])
            print_structure(sub_contents, indent + 1)


if __name__ == "__main__":
    repo_owner = "jackccrawford"
    repo_name = "nvidia-gpu-perf-monitor"
    contents = fetch_contents(repo_owner, repo_name)
    print_structure(contents)
