"""
hash_utils.py

This module provides utility functions for hashing. It includes functions for generating
deterministic hashes of file keys.

Functions:
----------
1. deterministic_hash(file_key):
   Generates a deterministic hash based on the file key, using SHA-256 and base64 encoding with filtered characters.
   
"""

import hashlib
import base64
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ALLOWED_CHARS_HASH = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-'

def deterministic_hash(file_key):
    """
    Generates a deterministic hash based on the file key, using SHA-256 and base64 encoding with filtered characters.

    The function extracts a substring from the file key starting from the occurrence of the word "videos", 
    if present. It then computes a SHA-256 hash of the substring, encodes it in base64, and filters out 
    any characters not in the allowed set.

    Parameters:
    -----------
    file_key : str
        The key of the file for which the hash is to be generated.

    Returns:
    --------
    str
        The deterministic hash of the file key, encoded in base64 and filtered to include only allowed characters.
    """
    # Find the index of "videos" in the string
    result = file_key
    videos_index = file_key.find("videos")
    
    # Check if "videos" is found in the string
    if videos_index != -1:
        # Extract the substring starting from "videos"
        result = file_key[videos_index:]
    
    # Use SHA-256 for hashing
    hash_object = hashlib.sha256(result.encode())
    
    # Use base64 encoding to convert the hash to a string
    hash_str = base64.urlsafe_b64encode(hash_object.digest()).decode('utf-8')
    
    # Remove padding characters from the base64 encoding
    hash_str = hash_str.rstrip('=')
    
    # Define the set of allowed characters
    allowed_chars = set(ALLOWED_CHARS_HASH)
    
    # Filter out any characters not in the allowed set
    filtered_hash = ''.join(char for char in hash_str if char in allowed_chars)
    
    return filtered_hash