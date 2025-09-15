import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorage() {
  try {
    console.log('Setting up Supabase Storage...');

    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const productsBucket = buckets?.find(b => b.name === 'products');

    if (!productsBucket) {
      console.log('Creating products bucket...');
      const { data, error } = await supabase.storage.createBucket('products', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      });

      if (error) {
        console.error('Error creating bucket:', error);
        return;
      }
      console.log('Products bucket created successfully');
    } else {
      console.log('Products bucket already exists');
    }

    // Set up bucket policies
    const { error: policyError } = await supabase
      .from('storage.policies')
      .upsert([
        {
          bucket_id: 'products',
          name: 'Give public access to products',
          definition: {
            operation: 'SELECT',
            role: 'anon'
          }
        },
        {
          bucket_id: 'products',
          name: 'Allow authenticated users to upload',
          definition: {
            operation: 'INSERT',
            role: 'authenticated'
          }
        },
        {
          bucket_id: 'products',
          name: 'Allow authenticated users to update',
          definition: {
            operation: 'UPDATE',
            role: 'authenticated'
          }
        },
        {
          bucket_id: 'products',
          name: 'Allow authenticated users to delete',
          definition: {
            operation: 'DELETE',
            role: 'authenticated'
          }
        }
      ]);

    if (policyError) {
      console.log('Note: Storage policies may need to be set manually in Supabase dashboard');
    }

    console.log('Storage setup complete!');
  } catch (error) {
    console.error('Error setting up storage:', error);
  }
}

setupStorage();