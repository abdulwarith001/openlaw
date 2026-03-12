import json
import os
import time
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv('/Users/engmare/personal-projects/knowthelaw/.env.local')

def main():
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("Error: OPENAI_API_KEY not found in .env.local")
        return

    client = OpenAI(api_key=api_key)
    
    input_file = "/Users/engmare/personal-projects/knowthelaw/src/data/vector_constitution.json"
    output_file = "/Users/engmare/personal-projects/knowthelaw/src/data/embeddings.json"
    
    with open(input_file, 'r') as f:
        sections = json.load(f)
    
    print(f"Loaded {len(sections)} sections. Starting vectorization...")
    
    results = []
    batch_size = 50 # OpenAI supports batching for embeddings
    
    # Pre-process: split overly long sections
    processed_items = []
    for doc in sections:
        content = doc['content']
        # Safe limit: 20k chars (~5k tokens)
        chunk_size = 20000
        if len(content) > chunk_size:
            print(f"Chunking long section: {doc.get('title', 'Unknown')} ({len(content)} chars)")
            chunks = [content[j:j+chunk_size] for j in range(0, len(content), chunk_size)]
            for k, chunk in enumerate(chunks):
                processed_items.append({
                    "title": doc.get('title', ''),
                    "path": doc.get('path', ''),
                    "content": chunk,
                    "is_chunk": True,
                    "chunk_id": k
                })
        else:
            processed_items.append({
                "title": doc.get('title', ''),
                "path": doc.get('path', ''),
                "content": content,
                "is_chunk": False,
                "chunk_id": 0
            })

    print(f"Total items to vectorize (including chunks): {len(processed_items)}")
    
    for i in range(0, len(processed_items), batch_size):
        batch = processed_items[i : i + batch_size]
        texts = [f"{s['title']}\n{s['content']}" for s in batch]
        
        try:
            print(f"Processing batch {i//batch_size + 1}/{(len(processed_items)-1)//batch_size + 1}...")
            response = client.embeddings.create(
                input=texts,
                model="text-embedding-3-small"
            )
            
            for j, data in enumerate(response.data):
                results.append({
                    "id": i + j,
                    "title": batch[j]['title'],
                    "path": batch[j]['path'],
                    "content": batch[j]['content'],
                    "embedding": data.embedding
                })
                
        except Exception as e:
            print(f"Error in batch starting at index {i}: {e}")
            continue

    # Save to file
    with open(output_file, 'w') as f:
        json.dump(results, f)
    
    print(f"Successfully generated embeddings for {len(results)} sections.")
    print(f"Saved to {output_file}")

if __name__ == "__main__":
    main()
