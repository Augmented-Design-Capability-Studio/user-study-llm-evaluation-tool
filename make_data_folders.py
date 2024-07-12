import os
import json

# Define the root directory where the folders will be created
root_dir = 'data'  # Replace with your desired root directory path

# Function to create the folders
def create_folders():
    # Loop to create folders P01 to P28
    for i in range(1, 29):
        folder_name = f'P{i:02d}'
        folder_path = os.path.join(root_dir, folder_name)
        
        # Create the main folder (P01, P02, ..., P28)
        os.makedirs(folder_path, exist_ok=True)
        
        # Create the subfolders (pythia, socratais, hephaistus) inside each main folder
        for subfolder in ['pythia', 'socratais', 'hephaistus']:
            subfolder_path = os.path.join(folder_path, subfolder)
            os.makedirs(subfolder_path, exist_ok=True)
    
    print("Folders created successfully!")

# Function to add P??_meta.json files
def add_meta_json():
    # Loop through folders P01 to P28
    for i in range(1, 29):
        folder_name = f'P{i:02d}'
        folder_path = os.path.join(root_dir, folder_name)
        
        # Define the meta file name
        meta_file_name = f'{folder_name}_meta.json'
        meta_file_path = os.path.join(folder_path, meta_file_name)
        
        # Create the meta data
        meta_data = {
            "folder": folder_name,
            "description": f"This is the metadata for {folder_name}."
        }
        
        # Write the meta data to the json file
        with open(meta_file_path, 'w') as meta_file:
            json.dump(meta_data, meta_file, indent=4)
    
    print("Meta JSON files added successfully!")

# Create the folders
create_folders()

# Add the meta json files
add_meta_json()
