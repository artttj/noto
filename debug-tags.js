// Debug script for tag filtering issues
// Run this in the sidebar DevTools console

async function debugTags() {
  const DB_NAME = 'sonto_db_v2';
  const STORE_NAME = 'sonto_items';

  console.log('=== DEBUGGING TAG FILTERING ===\n');

  // Open database
  const db = await new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  console.log('1. Database opened:', db.name, 'v' + db.version);
  console.log('   Object stores:', [...db.objectStoreNames]);

  // Get all items
  const allItems = await new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
  });

  console.log('\n2. Total items in database:', allItems.length);

  // Check items with tags
  const itemsWithTags = allItems.filter(i => i.tags?.length > 0);
  console.log('   Items with tags:', itemsWithTags.length);

  console.log('\n3. Items with tags:');
  itemsWithTags.forEach(item => {
    console.log('   - ID:', item.id);
    console.log('     Content:', item.content?.slice(0, 50) + '...');
    console.log('     Tags:', JSON.stringify(item.tags));
    console.log('     Tags type:', typeof item.tags, Array.isArray(item.tags) ? '(Array)' : '(NOT Array!)');
    console.log('');
  });

  // Test tag index
  const store = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME);
  console.log('4. Indexes:', [...store.indexNames]);

  if (store.indexNames.contains('tags')) {
    const tagsIndex = store.index('tags');
    console.log('   Tags index found, testing...');

    // Get all unique tags from index
    const allTags = await new Promise((resolve) => {
      const req = tagsIndex.getAllKeys();
      req.onsuccess = () => resolve([...new Set(req.result)]);
    });

    console.log('   All tag keys in index:', allTags);

    // Test query for each tag
    for (const tag of allTags.slice(0, 5)) {
      const items = await new Promise((resolve) => {
        const req = tagsIndex.getAll(tag);
        req.onsuccess = () => resolve(req.result);
      });
      console.log(`   - Tag "${tag}": ${items.length} items`);
    }
  } else {
    console.log('   WARNING: tags index NOT found!');
  }

  db.close();
  console.log('\n=== DEBUG COMPLETE ===');
}

// Run it
debugTags().catch(console.error);
