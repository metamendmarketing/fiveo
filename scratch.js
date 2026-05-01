require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
async function run() {
  const { data, error } = await supabase.from('products').select('sku, url_key, product_url').eq('sku', '55562599-280');
  console.log(data, error);
}
run();
