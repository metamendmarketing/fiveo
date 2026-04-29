const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkColumns() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { data, error } = await supabase.from('products').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
    return;
  }
  if (data && data.length > 0) {
    console.log('Columns in products table:', Object.keys(data[0]));
  } else {
    console.log('No products found.');
  }
}

checkColumns();
