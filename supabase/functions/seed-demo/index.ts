import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

interface SampleProduct {
  name: string;
  description: string;
  price: number;
  category: string;
  sku: string;
  image_url: string;
  is_available: boolean;
}

const CATEGORIES = [
  "Electronics",
  "Mobile Phones",
  "Accessories",
  "Fashion",
  "Watches",
  "Home Appliances",
  "Beauty & Cosmetics",
  "Health Products",
  "Sports & Fitness",
  "Home & Kitchen",
  "Food & Beverages",
  "Automotive",
  "Toys & Games",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function createUser() {
  const email = `demo_${Date.now()}@wflow.com`;
  const password = crypto.randomUUID();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "متجر التجريبي" },
  });
  if (error) throw error;
  console.log(`[seed] created user: ${email}, id=${data.user.id}`);
  return data.user;
}

async function createWorkspace(ownerId: string) {
  const name = "المتجر التجريبي";
  const slug = "demo-store-" + Date.now().toString(36);
  const { data, error } = await supabase
    .from("workspaces")
    .insert({
      name,
      slug,
      owner_id: ownerId,
      logo_url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200&h=200&fit=crop",
      description: "وجهتك المثالية للتسوق عبر الإنترنت. نقدم لكم تشكيلة واسعة من المنتجات المتنوعة بأفضل الأسعار وأعلى جودة.",
      phone: "+966 55 000 0000",
      address: "الرياض، المملكة العربية السعودية",
      social_links: {
        instagram: "https://instagram.com/demo_store",
        facebook: "https://facebook.com/demo_store",
        twitter: "https://x.com/demo_store",
        whatsapp: "https://wa.me/966550000000",
      },
    })
    .select("id")
    .single();
  if (error) throw error;

  // Add owner as workspace member
  const { error: memberErr } = await supabase
    .from("workspace_members")
    .insert({ workspace_id: data.id, user_id: ownerId, role: "owner" });
  if (memberErr) throw memberErr;

  console.log(`[seed] created workspace: ${data.id}, name=${name}, slug=${slug}`);
  return data;
}

const PRODUCTS: SampleProduct[] = [
  // Electronics
  { name: "سماعة بلوتوث لاسلكية", description: "سماعة أذن لاسلكية بتقنية Bluetooth 5.3 مع عزل الضوضاء النشط، عمر بطارية يصل إلى 30 ساعة، مقاومة للماء IPX5.", price: 249, category: "Electronics", sku: "ELC-001", image_url: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=600&h=600&fit=crop", is_available: true },
  { name: "باور بانك 20000mAh", description: "شاحن محمول بسعة 20000 ملي أمبير مع شحن سريع 65W، منفذين USB-C وUSB-A، يدعم الشحن اللاسلكي.", price: 189, category: "Electronics", sku: "ELC-002", image_url: "https://images.unsplash.com/photo-1609592424827-7f5f9a6b05b2?w=600&h=600&fit=crop", is_available: true },
  { name: "ساعة ذكية رياضية", description: "ساعة ذكية متعددة الوظائف مع قياس الأكسجين والنبض وضغط الدم، 100+ وضع رياضي، مقاومة للماء 50M.", price: 459, category: "Electronics", sku: "ELC-003", image_url: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&h=600&fit=crop", is_available: true },
  { name: "كاميرا مراقبة منزلية", description: "كاميرا مراقبة ذكية بدقة 2K، رؤية ليلية، كشف حركة ذكي، متوافقة مع Alexa وGoogle Home.", price: 329, category: "Electronics", sku: "ELC-004", image_url: "https://images.unsplash.com/photo-1558002038-1055907df827?w=600&h=600&fit=crop", is_available: true },
  { name: "جهاز عرض بروجيكتور", description: "بروجيكتور محمول بدقة 1080p FULL HD، سطوع 300 أنسي، مع مكبر صوت مدمج، يدخل WiFi 6.", price: 1299, category: "Electronics", sku: "ELC-005", image_url: "https://images.unsplash.com/photo-1601944179066-29786cb9d32a?w=600&h=600&fit=crop", is_available: true },

  // Mobile Phones
  { name: "هاتف Galaxy A55 5G", description: "شاشة 6.6 بوصة Super AMOLED، معالج Exynos 1480، ذاكرة 8/256GB، كاميرا 50MP، بطارية 5000mAh.", price: 1599, category: "Mobile Phones", sku: "MOB-001", image_url: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&h=600&fit=crop", is_available: true },
  { name: "هاتف iPhone 16 Pro", description: "شاشة 6.3 بوصة Super Retina XDR، معالج A18 Pro، كاميرا 48MP احترافية، بطارية تدوم 28 ساعة.", price: 4499, category: "Mobile Phones", sku: "MOB-002", image_url: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&h=600&fit=crop", is_available: true },
  { name: "هاتف Xiaomi Redmi Note 14", description: "شاشة 6.67 بوصة AMOLED 120Hz، معالج Snapdragon 7s Gen 2، كاميرا 108MP، بطارية 5100mAh.", price: 899, category: "Mobile Phones", sku: "MOB-003", image_url: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&h=600&fit=crop", is_available: true },

  // Accessories
  { name: "حافظة جلد فاخر للهاتف", description: "حافظة جلد طبيعي مع حامل بطاقات، متوفرة لأغلب الموديلات، تصميم أنيق وعصري.", price: 89, category: "Accessories", sku: "ACC-001", image_url: "https://images.unsplash.com/photo-1601787111447-9e6b0e16a50b?w=600&h=600&fit=crop", is_available: true },
  { name: "ساعة أبل Watch Ultra 2", description: "ساعة ذكية متطورة مع GPS مزدوج، شاشة 49mm، عمر بطارية 36 ساعة، مقاومة للغوص حتى 100M.", price: 2799, category: "Accessories", sku: "ACC-002", image_url: "https://images.unsplash.com/photo-1546868871-af0de0ae72d9?w=600&h=600&fit=crop", is_available: true },
  { name: "شاحن سيارة سريع 65W", description: "شاحن سيارة USB-C بقوة 65W، شحن سريع لجميع الأجهزة، مع مؤشر LED ذكي.", price: 79, category: "Accessories", sku: "ACC-003", image_url: "https://images.unsplash.com/photo-1583863761855-45d14cc46d82?w=600&h=600&fit=crop", is_available: true },
  { name: "حامل هاتف قابل للطي", description: "حامل هاتف متعدد الزوايا، قابل للطي والتعديل، يناسب جميع الأحجام، خفيف الوزن.", price: 39, category: "Accessories", sku: "ACC-004", image_url: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=600&h=600&fit=crop", is_available: true },

  // Fashion
  { name: "فستان كاجوال صيفي", description: "فستان نسائي بقصة مريحة، قماش قطني ناعم، متوفر بمقاسات متعددة وألوان زاهية.", price: 199, category: "Fashion", sku: "FSN-001", image_url: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=600&fit=crop", is_available: true },
  { name: "حقيبة ظهر عصرية", description: "حقيبة ظهر عملية بتصميم أنيق، مقاومة للماء، مع جيب للحاسوب المحمول حتى 15.6 بوصة.", price: 259, category: "Fashion", sku: "FSN-002", image_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop", is_available: true },
  { name: "نظارة شمسية رياضية", description: "نظارة شمسية بعدسات مستقطبة UV400، إطار خفيف الوزن، مناسبة للرياضة والقيادة.", price: 149, category: "Fashion", sku: "FSN-003", image_url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&h=600&fit=crop", is_available: true },

  // Watches
  { name: "ساعة يد كلاسيك", description: "ساعة يد رجالية بتصميم كلاسيكي أنيق، حركة كوارتز سويسرية، سوار جلد طبيعي، مقاومة للماء 50M.", price: 899, category: "Watches", sku: "WCH-001", image_url: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600&h=600&fit=crop", is_available: true },
  { name: "ساعة رياضية رقمية", description: "ساعة رقمية متعددة الوظائف، Stop Watch، عداد خطوات، منبه، إضاءة LED، مقاومة للماء.", price: 129, category: "Watches", sku: "WCH-002", image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop", is_available: true },

  // Home Appliances
  { name: "مكيف هواء محمول", description: "مكيف هواء محمول 3 في 1 (تبريد/تدفئة/مروحة)، سعة 12,000 BTU، مع جهاز تحكم عن بعد، مؤقت.", price: 1899, category: "Home Appliances", sku: "HAP-001", image_url: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&h=600&fit=crop", is_available: true },
  { name: "مكنسة روبوت ذكية", description: "مكنسة روبوت مع تقنية LiDAR، قوة شفط 5000Pa، خريطة ذكية متعددة الطوابق، تعمل 180 دقيقة.", price: 1299, category: "Home Appliances", sku: "HAP-002", image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=600&fit=crop", is_available: true },
  { name: "خلاط كهربائي متعدد", description: "خلاط بقوة 1500 واط، 10 سرعات، وعاء زجاجي 2 لتر، مطحنة توابل مرفقة.", price: 299, category: "Home Appliances", sku: "HAP-003", image_url: "https://images.unsplash.com/photo-1559163499-4136f6b2faa4?w=600&h=600&fit=crop", is_available: true },

  // Beauty & Cosmetics
  { name: "مجموعة عناية بالبشرة", description: "طقم عناية كامل: منظف، تونر، مرطب، سيروم فيتامين C، وواقي شمس SPF50.", price: 349, category: "Beauty & Cosmetics", sku: "BTY-001", image_url: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=600&fit=crop", is_available: true },
  { name: "عطر فاخر 100ml", description: "عطر فرنسي فاخر بمزيج من الزهور والعود، يدوم طويلاً، زجاجة 100 مل بتصميم أنيق.", price: 599, category: "Beauty & Cosmetics", sku: "BTY-002", image_url: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&h=600&fit=crop", is_available: true },
  { name: "مكياج احترافي كامل", description: "بالتة مكياج احترافية 48 لون، ظلال عيون، أحمر خدود، وأحمر شفاه عالي الجودة.", price: 199, category: "Beauty & Cosmetics", sku: "BTY-003", image_url: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=600&fit=crop", is_available: true },

  // Health Products
  { name: "جهاز قياس السكر", description: "جهاز قياس سكر دقيق بدون ألم، نتائج في 5 ثوان، ذاكرة 500 قراءة، مع شرائط مجانية.", price: 179, category: "Health Products", sku: "HLH-001", image_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=600&fit=crop", is_available: true },
  { name: "مقياس ضغط رقمي", description: "جهاز قياس ضغط دقيق للذراع، شاشة LCD كبيرة، كشف عدم انتظام ضربات القلب، ذاكرة 60 قراءة.", price: 219, category: "Health Products", sku: "HLH-002", image_url: "https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=600&h=600&fit=crop", is_available: true },

  // Sports & Fitness
  { name: "دمبلز قابل للتعديل", description: "طقم دمبلز من 2-24 كجم لكل يد، تعديل سريع، تصميم مريح، قاعدة تخزين مرفقة.", price: 799, category: "Sports & Fitness", sku: "SPT-001", image_url: "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=600&h=600&fit=crop", is_available: true },
  { name: "حبل مقاومة مطاطي", description: "حبل مقاومة متعدد المستويات، 5 أحزمة مطاطية بقوى مختلفة، مع حقيبة تخزين، تمارين كاملة.", price: 89, category: "Sports & Fitness", sku: "SPT-002", image_url: "https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=600&h=600&fit=crop", is_available: true },
  { name: "مشاية كهربائية", description: "مشاية كهربائية قابلة للطي، محرك 2.5HP، سرعة 1-16 كم/س، برامج تمارين مدمجة، شاشة LCD.", price: 2499, category: "Sports & Fitness", sku: "SPT-003", image_url: "https://images.unsplash.com/photo-1595078475328-1ab05d0a6a0e?w=600&h=600&fit=crop", is_available: true },

  // Home & Kitchen
  { name: "طقم قدور جرانيت 10 قطع", description: "طقم قدور جرانيت عالي الجودة، 10 قطع متنوعة، غير لاصق، مقابض سيليكون، مناسب لجميع المواقد.", price: 699, category: "Home & Kitchen", sku: "KIT-001", image_url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=600&fit=crop", is_available: true },
  { name: "صانعة قهوة اسبريسو", description: "ماكينة اسبريسو أوتوماتيكية، ضغط 20 بار، خزان ماء 1.8 لتر، مبخرة حليب مدمجة.", price: 449, category: "Home & Kitchen", sku: "KIT-002", image_url: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=600&h=600&fit=crop", is_available: true },
  { name: "محضرة طعام 3 في 1", description: "محضرة طعام متعددة الاستخدامات، خلاط + عجانة + عصارة، وعاء 5 لتر، 6 سرعات.", price: 529, category: "Home & Kitchen", sku: "KIT-003", image_url: "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=600&h=600&fit=crop", is_available: true },

  // Food & Beverages
  { name: "قهوة سوداء خاصة 500g", description: "قهوة عربية فاخرة محمصة طازجة، حبوب أرابيكا 100%، طحن متوسط مناسب للجميع.", price: 89, category: "Food & Beverages", sku: "FOD-001", image_url: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&h=600&fit=crop", is_available: true },
  { name: "عسل طبيعي عضوي 250g", description: "عسل جبلي طبيعي 100% من نحل جبال السروات، غني بالفيتامينات والمعادن.", price: 129, category: "Food & Beverages", sku: "FOD-002", image_url: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&h=600&fit=crop", is_available: true },
  { name: "زيت زيتون بكر 1 لتر", description: "زيت زيتون بكر ممتاز إيطالي، حصاد مبكر، حمضية أقل من 0.3%، معبأ في زجاجة داكنة.", price: 69, category: "Food & Beverages", sku: "FOD-003", image_url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&h=600&fit=crop", is_available: true },

  // Automotive
  { name: "شاحن سيارة بلوتوث FM", description: "جهاز إرسال FM بلوتوث لاسلكي، شحن سريع 5V/4.8A، يدعم المكالمات والاغاني، شاشة LED.", price: 69, category: "Automotive", sku: "AUT-001", image_url: "https://images.unsplash.com/photo-1612441805983-7a9779b8d6b6?w=600&h=600&fit=crop", is_available: true },
  { name: "ممسحة زجاج أمامية 26\"", description: "ممسحة زجاج سيارة مطاطية سيليكون، مقاومة للعوامل الجوية، طول 26 بوصة لمعظم السيارات.", price: 89, category: "Automotive", sku: "AUT-002", image_url: "https://images.unsplash.com/photo-1629896880280-539d1c0e2987?w=600&h=600&fit=crop", is_available: true },
  { name: "مفارش مقاعد سيارة جلد", description: "مفارش مقاعد جلد فاخر لجميع السيارات، متوافقة مع الوسائد الهوائية، سهلة التركيب.", price: 449, category: "Automotive", sku: "AUT-003", image_url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=600&fit=crop", is_available: true },

  // Toys & Games
  { name: "لعبة أطفال تعليمية", description: "لعبة بناء وتعليم للأطفال فوق 3 سنوات، 100 قطعة ملونة، تنمي المهارات الحركية والإبداع.", price: 149, category: "Toys & Games", sku: "TOY-001", image_url: "https://images.unsplash.com/photo-1596460107916-430c021c0cc0?w=600&h=600&fit=crop", is_available: true },
  { name: "درون كاميرا 4K", description: "طائرة درون بكاميرا 4K، مثبت إلكتروني، مدى طيران 1.5 كم، بطارية 30 دقيقة، GPS.", price: 1799, category: "Toys & Games", sku: "TOY-002", image_url: "https://images.unsplash.com/photo-1579829366248-204fe8413f31?w=600&h=600&fit=crop", is_available: true },
  { name: "لعبة ألغاز 1000 قطعة", description: "أحجية (Puzzle) 1000 قطعة بمناظر طبيعية خلابة، ورق مقوى عالي الجودة، مقاس 70x50 سم.", price: 59, category: "Toys & Games", sku: "TOY-003", image_url: "https://images.unsplash.com/photo-1582015646332-a7d7a6d3b5ed?w=600&h=600&fit=crop", is_available: true },
];

Deno.serve(async (req) => {
  try {
    // 1. Find existing user or create one
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    let owner = existingUsers?.users?.[0] ?? null;

    if (!owner) {
      owner = await createUser();
    }

    // 2. Find existing workspace or create one
    const { data: existingWorkspaces } = await supabase
      .from("workspaces")
      .select("id, name")
      .limit(1);

    let workspace: { id: string };
    if (existingWorkspaces && existingWorkspaces.length > 0) {
      workspace = existingWorkspaces[0];
      console.log(`[seed] using existing workspace: ${workspace.id} (${workspace.name})`);
    } else {
      workspace = await createWorkspace(owner.id);
    }

    // 3. Insert sample products (skip duplicates by SKU)
    let inserted = 0;
    let skipped = 0;
    for (const product of PRODUCTS) {
      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .eq("sku", product.sku)
        .eq("workspace_id", workspace.id)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      const { error } = await supabase.from("products").insert({
        workspace_id: workspace.id,
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        sku: product.sku,
        image_url: product.image_url,
        is_available: product.is_available,
      });

      if (error) {
        console.error(`[seed] error inserting ${product.sku}:`, error.message);
      } else {
        inserted++;
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        workspace_id: workspace.id,
        workspace_name: existingWorkspaces?.[0]?.name || "المتجر التجريبي",
        products_inserted: inserted,
        products_skipped: skipped,
        total_categories: CATEGORIES.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      },
    );
  } catch (err) {
    console.error("[seed] error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } },
    );
  }
});
