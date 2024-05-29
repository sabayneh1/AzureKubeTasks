import os

def concatenate_files(start_path, output_file_path):
    with open(output_file_path, 'w') as output_file:
        for dirpath, dirnames, filenames in os.walk(start_path):
            for filename in filenames:
                filepath = os.path.join(dirpath, filename)
                # Skip if it is symbolic link
                if not os.path.islink(filepath):
                    try:
                        with open(filepath, 'r') as file:
                            content = file.read()
                            output_file.write(content + "\n")  # Add a newline after each file's content
                            print(f"Added content from {filepath}")
                    except Exception as e:
                        print(f"Error reading {filepath}: {e}")

# Use a raw string for Windows path
directory_path = r'/home/azureuser/AzureKubeTasks/docker/ToDo-service'
# directory_path = r'C:\Users\saman\OneDrive\Desktop\study+projects\NCPL\projectcs\Microservice-Kubernties\eks\Blogplatform\kube'
output_file_path = 'combined_output.txt'

concatenate_files(directory_path, output_file_path)
print(f"All file contents have been combined into {output_file_path}.")
