import urllib.request
import urllib.parse
import json
import time
import os

HEADERS = {
    'User-Agent': 'GreenNestBloomBotanicalApp/1.0 (https://greennestbloom.com; info@greennestbloom.com)'
}

DOWNLOAD_DIR = 'frontend/public'
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

TARGETS = {
    # Fruit Trees & Saplings
    'banana_plant.jpg': 'Musa acuminata plant fruit',
    'guava_plant.jpg': 'Psidium guajava fruit tree',
    'pomegranate_plant.jpg': 'Punica granatum tree fruit',
    'papaya_plant.jpg': 'Carica papaya tree fruit',
    'custard_apple.jpg': 'Annona squamosa fruit tree',
    'chikoo_plant.jpg': 'Manilkara zapota tree fruit sapodilla',
    'lemon_plant.jpg': 'Citrus aurantiifolia tree fruit lemon',
    'dragon_fruit.jpg': 'Hylocereus undatus pitaya fruit plant',
    'dragon_fruit_yellow.jpg': 'Selenicereus megalanthus yellow pitahaya',
    'amla_plant.jpg': 'Phyllanthus emblica gooseberry tree',
    'pear_sapling.jpg': 'Pyrus pyrifolia Asian pear tree fruit',
    'plum_tree.jpg': 'Prunus salicina plum tree fruit',
    'avocado_plant.jpg': 'Persea americana avocado tree fruit',
    'tamarind_plant.jpg': 'Tamarindus indica pods tree',
    'palmyra_palm.jpg': 'Borassus flabellifer tree palm',
    'arecanut_palm.jpg': 'Areca catechu palm tree',
    'coconut_palm.jpg': 'Cocos nucifera coconut palm tree',

    # Vegetables
    'green_chilli.jpg': 'Capsicum annuum green chilli plant',
    'brinjal_plant.jpg': 'Solanum melongena eggplant plant',
    'tomato_plant.jpg': 'Solanum lycopersicum tomato plant ripe',
    'okra_plant.jpg': 'Abelmoschus esculentus okra plant flower',
    'bitter_gourd.jpg': 'Momordica charantia fruit vine',
    'bottle_gourd.jpg': 'Lagenaria siceraria calabash gourd vine',
    'malabar_spinach.jpg': 'Basella alba vine leaves',
    'muskmelon_vine.jpg': 'Cucumis melo cantaloupe muskmelon fruit',
    'black_pepper_vine.jpg': 'Piper nigrum black pepper vine spikes',
    'red_bell_pepper.jpg': 'Capsicum annuum red bell pepper plant',
    'yellow_bell_pepper.jpg': 'Capsicum annuum yellow bell pepper plant',
    'green_bell_pepper.jpg': 'Capsicum annuum green bell pepper plant',

    # Herbs
    'giloy_plant.jpg': 'Tinospora cordifolia leaves plant',
    'mint_herb.jpg': 'Mentha spicata spearmint pot herb',
    'coriander_pot.jpg': 'Coriandrum sativum cilantro fresh herb',
    'turmeric_plant.jpg': 'Curcuma longa turmeric plant leaves',
    'ginger_plant.jpg': 'Zingiber officinale ginger plant rhizome',

    # Marigolds
    'yellow_marigold.jpg': 'Tagetes patula yellow french marigold',
    'crimson_marigold.jpg': 'Tagetes patula red brocade copper marigold',

    # Planters & Accessories
    'nordic_ceramic_pot.jpg': 'ceramic plant pot planter green indoor',
    'potting_mix.jpg': 'potting soil organic compost perlite garden',
    'terracotta_pot_8in.jpg': 'terracotta flower pot clay earthenware',
    'terracotta_pot_12in.jpg': 'terracotta garden pot large plant planter',
    'terracotta_pot_5in.jpg': 'small terracotta pot plant clay',
    'khurja_mud_planter.jpg': 'Indian terracotta pot clay handicraft',
    'plastic_pot_6in.jpg': 'plastic flower pot nursery container plant',
    'plastic_planter_12in.jpg': 'plastic planter outdoor garden pot',
    'self_watering_pot.jpg': 'self watering planter pot indoor plant',
    'glass_planter_bowl.jpg': 'glass bowl vase water plant hydroponic',
    'glass_fluted_planter.jpg': 'fluted glass vase planter botanical water',
    'pastel_ceramic_pot.jpg': 'pastel ceramic planter pot indoor plant'
}

def search_and_download(filename, search_term):
    target_path = os.path.join(DOWNLOAD_DIR, filename)
    if os.path.exists(target_path) and os.path.getsize(target_path) > 10000:
        print(f"Skipping {filename} (already exists, {os.path.getsize(target_path)} bytes)")
        return True

    encoded_term = urllib.parse.quote(search_term)
    url = f"https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch={encoded_term}&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json"

    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            pages = data.get('query', {}).get('pages', {})
            for page_id, page_info in pages.items():
                title = page_info.get('title', '')
                if any(ext in title.lower() for ext in ['.jpg', '.jpeg', '.png']):
                    imageinfo = page_info.get('imageinfo', [])
                    if imageinfo:
                        thumb_url = imageinfo[0].get('thumburl') or imageinfo[0].get('url')
                        if thumb_url:
                            # Try downloading
                            img_req = urllib.request.Request(thumb_url, headers=HEADERS)
                            with urllib.request.urlopen(img_req, timeout=12) as img_resp:
                                img_data = img_resp.read()
                                if len(img_data) > 5000:
                                    with open(target_path, 'wb') as f_out:
                                        f_out.write(img_data)
                                    print(f"Downloaded {filename} ({len(img_data)} bytes) from {title}")
                                    return True
        print(f"No suitable image found for {filename} ({search_term})")
        return False
    except Exception as e:
        print(f"Error fetching {filename} ({search_term}): {e}")
        return False

for filename, search_term in TARGETS.items():
    search_and_download(filename, search_term)
    time.sleep(0.3)
