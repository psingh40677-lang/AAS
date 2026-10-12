import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronDown, Heart,
  Leaf, MapPin, Menu, Search, ShoppingBag, Sparkles, X
} from 'lucide-react';
import './SetuNovaPage.css';

const categories = [
  { name: 'All finds', icon: '✳', color: 'lavender' },
  { name: 'Fresh produce', icon: '🥬', color: 'green' },
  { name: 'Handmade crafts', icon: '🧶', color: 'peach' },
  { name: 'Pantry goods', icon: '🍯', color: 'yellow' },
  { name: 'Home & living', icon: '🏺', color: 'blue' },
  { name: 'Wearables', icon: '🧵', color: 'pink' }
];

const products = [
  {
    id: 1, name: 'Sun-warmed heirloom tomatoes', maker: 'Meera’s little farm', category: 'Fresh produce',
    price: 120, unit: 'per 500 g', badge: 'Picked this morning', image: 'photo-1546094096-0df4bcaaa337',
    imageAlt: 'Fresh red heirloom tomatoes'
  },
  {
    id: 2, name: 'The everyday clay cup', maker: 'Asha Pottery Studio', category: 'Home & living',
    price: 480, unit: 'set of 2', badge: 'Made by hand', image: 'photo-1514228742587-6b1558fcca3d',
    imageAlt: 'Handmade ceramic cup'
  },
  {
    id: 3, name: 'Slow-stitched market tote', maker: 'Threads of Kutch', category: 'Handmade crafts',
    price: 850, unit: 'one of a kind', badge: 'Only 4 left', image: 'photo-1590874103328-eac38a683ce7',
    imageAlt: 'Artisan woven market tote'
  },
  {
    id: 4, name: 'Raw forest honey', maker: 'Nanda Valley Collective', category: 'Pantry goods',
    price: 340, unit: '250 g jar', badge: 'Small-batch', image: 'photo-1587049352851-8d4e89133924',
    imageAlt: 'Golden jar of raw honey'
  },
  {
    id: 5, name: 'A basket of greens', maker: 'Meera’s little farm', category: 'Fresh produce',
    price: 260, unit: 'seasonal box', badge: 'Grown without rush', image: 'photo-1540420773420-3366772f4999',
    imageAlt: 'A basket of fresh seasonal greens'
  },
  {
    id: 6, name: 'Block-print cotton scarf', maker: 'Rangrez by Farida', category: 'Wearables',
    price: 720, unit: 'naturally dyed', badge: 'Naturally dyed', image: 'photo-1601924994987-69e26d50dc26',
    imageAlt: 'Hand-printed artisan textile'
  },
  {
    id: 7, name: 'Palm-leaf picnic basket', maker: 'Coast & Cane', category: 'Handmade crafts',
    price: 1100, unit: 'woven to order', badge: 'Made by hand', image: 'photo-1590301157890-4810ed352733',
    imageAlt: 'Handwoven natural-fibre basket'
  },
  {
    id: 8, name: 'Stone-ground turmeric', maker: 'Nanda Valley Collective', category: 'Pantry goods',
    price: 190, unit: '100 g pouch', badge: 'Grown close to home',    image: 'photo-1509358271058-acd22cc93898',
    imageAlt: 'Golden turmeric powder and roots'
  }
];

const imageUrl = (photoId, width = 720) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${width}&q=85`;

export default function SetuNovaPage() {
  const [activeCategory, setActiveCategory] = useState('All finds');
  const [query, setQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [notice, setNotice] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => setNotice(''), 2600);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Setu Nova | Good things. Good people.';
    return () => { document.title = previousTitle; };
  }, []);

  const visibleProducts = useMemo(() => {
    const search = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = activeCategory === 'All finds' || product.category === activeCategory;
      const matchesSearch = !search || `${product.name} ${product.maker} ${product.category}`.toLowerCase().includes(search);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, query]);

  const addToCart = (productName) => {
    setCartCount((count) => count + 1);
    setNotice(`${productName} added to your bag`);
  };

  const toggleFavorite = (id) => {
    setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  return (
    <div className="setu-page">
      <div className="setu-topline">
        <span><Sparkles size={14} /> Good things, made close to home</span>
        <a href="#makers">Meet the people behind your finds <ArrowRight size={13} /></a>
      </div>

      <header className="setu-header">
        <a className="setu-wordmark" href="#top" aria-label="Setu Nova home">
          setu<span>nova</span><i>✳</i>
        </a>
        <button className="setu-menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        <nav className={`setu-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
          <a href="#shop" onClick={() => setMenuOpen(false)}>Shop everything</a>
          <a href="#categories" onClick={() => setMenuOpen(false)}>Collections</a>
          <a href="#makers" onClick={() => setMenuOpen(false)}>Our makers</a>
        </nav>
        <div className="setu-header-actions">
          <label className="setu-search">
            <Search size={17} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })}
              placeholder="Find your next favourite"
              aria-label="Search products and makers"
            />
            <span>⌘ K</span>
          </label>
          <button className="setu-bag" onClick={() => setNotice(cartCount ? `Your bag has ${cartCount} ${cartCount === 1 ? 'item' : 'items'}` : 'Your bag is ready for something lovely')}>
            <ShoppingBag size={18} /> <span>Bag</span><b>{cartCount}</b>
          </button>
        </div>
      </header>

      <main id="top">
        <section className="setu-hero">
          <div className="setu-hero-copy">
            <span className="setu-kicker"><span /> A marketplace with a little more meaning</span>
            <h1>Good things.<br /><em>Good people.</em><br />Good neighbours.</h1>
            <p>Fresh from the farm, made by hand, and full of the stories that make a place feel like home.</p>
            <a className="setu-primary-link" href="#shop">Find your kind of good <ArrowRight size={16} /></a>
            <div className="setu-hero-note"><MapPin size={15} /> Thoughtfully found, closer to home</div>
          </div>
          <div className="setu-hero-art">
            <img src={imageUrl('photo-1490645935967-10de6ba17061', 1200)} alt="A colourful table of fresh seasonal produce" />
            <div className="setu-art-label"><span>FRESH FROM THE NEIGHBOURHOOD</span><strong>A little closer<br />to the good stuff.</strong></div>
            <span className="setu-art-sticker">grown<br />with care <Leaf size={17} /></span>
            <span className="setu-image-credit">A slower, more thoughtful way to shop <ArrowUpRight size={13} /></span>
          </div>
          <div className="setu-hero-index"><span>01</span><i /><span>03</span></div>
          <a className="setu-scroll-cue" href="#categories" aria-label="Scroll to collections"><ArrowDown size={15} /></a>
        </section>

        <section className="setu-categories" id="categories">
          <div className="setu-section-heading">
            <div><span className="setu-kicker">A good place to start</span><h2>What are you in the mood for?</h2></div>
            <p>Little discoveries from the people and places around us.</p>
          </div>
          <div className="setu-category-list">
            {categories.map((category) => (
              <button
                key={category.name}
                className={`setu-category ${category.color} ${activeCategory === category.name ? 'selected' : ''}`}
                onClick={() => { setActiveCategory(category.name); document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }); }}
              >
                <span className="setu-category-icon">{category.icon}</span>
                <span>{category.name}</span><ArrowUpRight size={15} />
              </button>
            ))}
          </div>
        </section>

        <section className="setu-shop" id="shop">
          <div className="setu-section-heading setu-shop-heading">
            <div>
              <span className="setu-kicker">The good stuff, right now</span>
              <h2>Fresh finds from our makers<span>.</span></h2>
            </div>
            <button className="setu-sort" onClick={() => { setActiveCategory('All finds'); setQuery(''); }}>
              {activeCategory === 'All finds' ? 'A little bit of everything' : activeCategory}
              <ChevronDown size={15} />
            </button>
          </div>
          <div className="setu-product-grid">
            {visibleProducts.map((product) => (
              <article className="setu-product-card" key={product.id}>
                <div className="setu-product-image">
                  <img src={imageUrl(product.image)} alt={product.imageAlt} loading="lazy" />
                  <span className="setu-product-badge">{product.badge}</span>
                  <button
                    className={`setu-favorite ${favorites.includes(product.id) ? 'is-favorite' : ''}`}
                    onClick={() => toggleFavorite(product.id)}
                    aria-label={`${favorites.includes(product.id) ? 'Remove' : 'Add'} ${product.name} ${favorites.includes(product.id) ? 'from' : 'to'} favourites`}
                    aria-pressed={favorites.includes(product.id)}
                  >
                    <Heart size={17} fill={favorites.includes(product.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <div className="setu-product-info">
                  <span className="setu-product-maker">{product.maker}</span>
                  <h3>{product.name}</h3>
                  <div className="setu-product-bottom">
                    <span><strong>₹{product.price}</strong><small>{product.unit}</small></span>
                    <button onClick={() => addToCart(product.name)} aria-label={`Add ${product.name} to bag`}><span>Add to bag</span><ArrowRight size={15} /></button>
                  </div>
                </div>
              </article>
            ))}
            {!visibleProducts.length && (
              <div className="setu-empty">
                <span>Nothing here just yet.</span>
                <p>Try another search or browse all the good finds.</p>
                <button onClick={() => { setActiveCategory('All finds'); setQuery(''); }}>Show everything <ArrowRight size={15} /></button>
              </div>
            )}
          </div>
          {visibleProducts.length > 0 && (
            <button className="setu-view-all" onClick={() => { setActiveCategory('All finds'); setQuery(''); }}>
              See all the good finds <ArrowRight size={15} />
            </button>
          )}
        </section>

        <section className="setu-maker-story" id="makers">
          <div className="setu-maker-image">
            <img src={imageUrl('photo-1464226184884-fa280b87c399', 1000)} loading="lazy" alt="A small farmer holding freshly harvested produce" />
            <span className="setu-maker-stamp">REAL PEOPLE<br />REAL GOOD</span>
          </div>
          <div className="setu-maker-copy">
            <span className="setu-kicker">More than a marketplace</span>
            <h2>Know whose hands<br />made your <em>everyday.</em></h2>
            <p>Behind every little find is a person, a patch of land, a family recipe, or a skill passed down with love. We bring their work a little closer to you.</p>
            <a href="#shop">Get to know our makers <ArrowRight size={16} /></a>
            <div className="setu-maker-stats"><strong>Small batches.</strong><i /><strong>Fairer prices.</strong><i /><strong>Made with heart.</strong></div>
          </div>
        </section>

        <section className="setu-note">
          <span>✳</span><p>Good for your home. <em>Good for the hands that made it.</em></p><span>✳</span>
        </section>
      </main>

      <footer className="setu-footer">
        <a className="setu-wordmark" href="#top">setu<span>nova</span><i>✳</i></a>
        <span>A little more local. A lot more lovely.</span>
        <a href="#top">Back to the good stuff <ArrowUpRight size={14} /></a>
      </footer>

      {notice && <div className="setu-notice" role="status"><Check size={16} />{notice}<button onClick={() => setNotice('')} aria-label="Dismiss"><X size={15} /></button></div>}
    </div>
  );
}
