'use client';

import { useEffect, useRef, useState } from 'react';
import { Monitor, Smartphone, Tablet, RefreshCw, ExternalLink, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  StoreCustomization, 
  generateCSSVariables,
  generateGoogleFontsUrl 
} from '@/lib/store-customization-types';

interface LivePreviewProps {
  customization: StoreCustomization;
  sellerName: string;
  sellerLogo?: string;
  sellerBanner?: string;
  sellerDescription?: string;
  storeUrl: string;
}

type DeviceType = 'desktop' | 'tablet' | 'mobile';

const deviceWidths: Record<DeviceType, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
};

export function LivePreview({
  customization,
  sellerName,
  sellerLogo,
  sellerBanner,
  sellerDescription,
  storeUrl,
}: LivePreviewProps) {
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Generate preview HTML
  const generatePreviewHTML = () => {
    const cssVars = generateCSSVariables(customization);
    const fontsUrl = generateGoogleFontsUrl(customization);
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${fontsUrl}" rel="stylesheet">
  <style>
    ${cssVars}
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: var(--store-body-font);
      font-size: var(--store-base-font-size);
      color: var(--store-text);
      background-color: var(--store-background);
      line-height: 1.5;
    }
    
    h1, h2, h3, h4, h5, h6 {
      font-family: var(--store-heading-font);
    }
    
    /* Header Styles */
    .header {
      background-color: var(--store-header-bg);
      border-bottom: 1px solid var(--store-border);
      position: ${customization.header.sticky ? 'sticky' : 'relative'};
      top: 0;
      z-index: 50;
    }
    
    .header-minimal {
      padding: 0.75rem 1.5rem;
    }
    
    .header-standard {
      padding: 1rem 1.5rem;
    }
    
    .header-bold {
      padding: 1.25rem 1.5rem;
      background: linear-gradient(135deg, var(--store-primary), var(--store-secondary));
    }
    
    .header-bold * {
      color: white !important;
    }
    
    .header-centered {
      padding: 1rem 1.5rem;
      text-align: center;
    }
    
    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .header-centered .header-content {
      flex-direction: column;
      gap: 1rem;
    }
    
    .logo-section {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    
    .logo {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      object-fit: cover;
    }
    
    .logo-placeholder {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: linear-gradient(135deg, var(--store-primary), var(--store-accent));
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 1.25rem;
    }
    
    .store-name {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--store-text);
    }
    
    .header-bold .store-name {
      color: white;
    }
    
    /* Navigation */
    .nav {
      display: flex;
      gap: 1.5rem;
    }
    
    .header-centered .nav {
      justify-content: center;
    }
    
    .nav-link {
      color: var(--store-text-muted);
      text-decoration: none;
      font-size: 0.875rem;
      transition: color 0.2s;
    }
    
    .nav-link:hover {
      color: var(--store-primary);
    }
    
    .header-bold .nav-link {
      color: rgba(255,255,255,0.8);
    }
    
    .header-bold .nav-link:hover {
      color: white;
    }
    
    /* Announcement Banner */
    .announcement {
      background: linear-gradient(90deg, var(--store-primary), var(--store-accent));
      color: white;
      text-align: center;
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }
    
    /* Hero Section */
    .hero {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    
    .hero-small { min-height: 200px; }
    .hero-medium { min-height: 350px; }
    .hero-large { min-height: 500px; }
    .hero-full { min-height: calc(100vh - 80px); }
    
    .hero-gradient {
      background: linear-gradient(135deg, ${customization.hero.gradientStart || customization.colors.primary}, ${customization.hero.gradientEnd || customization.colors.accent});
    }
    
    .hero-image {
      background-size: cover;
      background-position: center;
    }
    
    .hero-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,${customization.hero.overlayOpacity || 0.5});
    }
    
    .hero-content {
      position: relative;
      z-index: 10;
      text-align: ${customization.hero.textAlignment || 'center'};
      padding: 2rem;
      max-width: 800px;
    }
    
    .hero-title {
      font-size: 2.5rem;
      font-weight: 700;
      color: white;
      margin-bottom: 1rem;
    }
    
    .hero-subtitle {
      font-size: 1.125rem;
      color: rgba(255,255,255,0.9);
      margin-bottom: 1.5rem;
    }
    
    .hero-cta {
      display: inline-block;
      padding: 0.75rem 2rem;
      background: white;
      color: var(--store-primary);
      font-weight: 600;
      border-radius: 8px;
      text-decoration: none;
      transition: transform 0.2s;
    }
    
    .hero-cta:hover {
      transform: scale(1.05);
    }
    
    /* Sections */
    .section {
      padding: 3rem 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .section-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--store-text);
      margin-bottom: 2rem;
      text-align: center;
    }
    
    /* Trust Badges */
    .trust-badges {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
    }
    
    .trust-badge {
      background: white;
      border: 1px solid var(--store-border);
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .trust-badge-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: ${customization.colors.primary}15;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--store-primary);
    }
    
    .trust-badge-title {
      font-weight: 600;
      color: var(--store-text);
    }
    
    .trust-badge-desc {
      font-size: 0.875rem;
      color: var(--store-text-muted);
    }
    
    /* Product Grid */
    .product-grid {
      display: grid;
      grid-template-columns: repeat(${customization.productGrid.columns}, 1fr);
      gap: 1.5rem;
    }
    
    @media (max-width: 768px) {
      .product-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    
    .product-card {
      background: white;
      border: 1px solid var(--store-border);
      border-radius: 12px;
      overflow: hidden;
      transition: box-shadow 0.2s, transform 0.2s;
    }
    
    .product-card:hover {
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      transform: translateY(-4px);
    }
    
    .product-image {
      aspect-ratio: ${customization.productGrid.imageAspectRatio === 'portrait' ? '3/4' : customization.productGrid.imageAspectRatio === 'landscape' ? '4/3' : '1/1'};
      background: #f3f4f6;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #9ca3af;
    }
    
    .product-info {
      padding: 1rem;
    }
    
    .product-name {
      font-weight: 600;
      color: var(--store-text);
      margin-bottom: 0.5rem;
    }
    
    .product-price {
      color: var(--store-primary);
      font-weight: 700;
    }
    
    /* Footer */
    .footer {
      background-color: var(--store-footer-bg);
      color: ${customization.footer.style === 'simple' || customization.footer.style === 'minimal' ? 'var(--store-text-muted)' : 'rgba(255,255,255,0.8)'};
      padding: 3rem 1.5rem;
      margin-top: 3rem;
    }
    
    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .footer-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }
    
    .footer-section h4 {
      font-weight: 600;
      margin-bottom: 1rem;
      color: ${customization.footer.style === 'simple' || customization.footer.style === 'minimal' ? 'var(--store-text)' : 'white'};
    }
    
    .footer-links {
      list-style: none;
    }
    
    .footer-links li {
      margin-bottom: 0.5rem;
    }
    
    .footer-links a {
      color: inherit;
      text-decoration: none;
    }
    
    .footer-links a:hover {
      color: var(--store-primary);
    }
    
    .footer-bottom {
      padding-top: 2rem;
      border-top: 1px solid ${customization.footer.style === 'simple' || customization.footer.style === 'minimal' ? 'var(--store-border)' : 'rgba(255,255,255,0.1)'};
      text-align: center;
      font-size: 0.875rem;
    }
    
    .footer-minimal {
      text-align: center;
      padding: 1.5rem;
    }
    
    .footer-centered {
      text-align: center;
    }
    
    /* About Block */
    .about-block {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3rem;
      align-items: center;
    }
    
    @media (max-width: 768px) {
      .about-block {
        grid-template-columns: 1fr;
      }
    }
    
    .about-image {
      aspect-ratio: 4/3;
      background: linear-gradient(135deg, var(--store-primary), var(--store-accent));
      border-radius: 12px;
    }
    
    .about-text {
      color: var(--store-text-muted);
      line-height: 1.8;
    }
    
    /* Newsletter */
    .newsletter {
      background: linear-gradient(135deg, var(--store-primary), var(--store-accent));
      border-radius: 16px;
      padding: 3rem;
      text-align: center;
      color: white;
    }
    
    .newsletter-title {
      color: white;
      margin-bottom: 0.5rem;
    }
    
    .newsletter-form {
      display: flex;
      gap: 0.5rem;
      max-width: 400px;
      margin: 1.5rem auto 0;
    }
    
    .newsletter-input {
      flex: 1;
      padding: 0.75rem 1rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
    }
    
    .newsletter-btn {
      padding: 0.75rem 1.5rem;
      background: white;
      color: var(--store-primary);
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }
    
    /* Testimonials */
    .testimonials-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    
    .testimonial-card {
      background: white;
      border: 1px solid var(--store-border);
      border-radius: 12px;
      padding: 1.5rem;
    }
    
    .testimonial-content {
      color: var(--store-text-muted);
      font-style: italic;
      margin-bottom: 1rem;
    }
    
    .testimonial-author {
      font-weight: 600;
      color: var(--store-text);
    }
    
    /* FAQ */
    .faq-list {
      max-width: 800px;
      margin: 0 auto;
    }
    
    .faq-item {
      border: 1px solid var(--store-border);
      border-radius: 8px;
      margin-bottom: 1rem;
      overflow: hidden;
    }
    
    .faq-question {
      padding: 1rem 1.5rem;
      font-weight: 600;
      background: white;
      cursor: pointer;
    }
    
    .faq-answer {
      padding: 0 1.5rem 1rem;
      color: var(--store-text-muted);
    }
  </style>
</head>
<body>
  ${customization.header.announcement.enabled && customization.header.announcement.text ? `
    <div class="announcement">${customization.header.announcement.text}</div>
  ` : ''}
  
  <header class="header header-${customization.header.style}">
    <div class="header-content">
      <div class="logo-section">
        ${sellerLogo ? `<img src="${sellerLogo}" alt="${sellerName}" class="logo">` : `<div class="logo-placeholder">${sellerName.charAt(0)}</div>`}
        <span class="store-name">${sellerName}</span>
      </div>
      
      <nav class="nav">
        ${customization.navigation.filter(n => n.visible).map(nav => `
          <a href="${nav.href}" class="nav-link">${nav.label}</a>
        `).join('')}
      </nav>
      
      ${customization.header.showSearch || customization.header.showCart ? `
        <div class="header-actions">
          ${customization.header.showCart ? '🛒' : ''}
        </div>
      ` : ''}
    </div>
  </header>
  
  ${customization.hero.type !== 'none' ? `
    <section class="hero hero-${customization.hero.height} hero-${customization.hero.type}" 
      ${customization.hero.type === 'image' && customization.hero.backgroundImage ? `style="background-image: url('${customization.hero.backgroundImage}')"` : ''}
      ${customization.hero.type === 'image' && sellerBanner ? `style="background-image: url('${sellerBanner}')"` : ''}>
      ${customization.hero.type === 'image' || customization.hero.type === 'video' ? '<div class="hero-overlay"></div>' : ''}
      <div class="hero-content">
        <h1 class="hero-title">${customization.hero.content.title || `Welcome to ${sellerName}`}</h1>
        <p class="hero-subtitle">${customization.hero.content.subtitle || sellerDescription || 'Discover amazing products at great prices'}</p>
        ${customization.hero.content.cta ? `
          <a href="${customization.hero.content.cta.link || '/products'}" class="hero-cta">${customization.hero.content.cta.text || 'Shop Now'}</a>
        ` : ''}
      </div>
    </section>
  ` : ''}
  
  <main>
    ${customization.sections
      .filter(s => s.enabled)
      .sort((a, b) => a.order - b.order)
      .map(section => {
        switch (section.type) {
          case 'featured-products':
            return `
              <section class="section">
                <h2 class="section-title">${section.title || 'Featured Products'}</h2>
                <div class="product-grid">
                  ${Array(4).fill(0).map((_, i) => `
                    <div class="product-card">
                      <div class="product-image">📦</div>
                      <div class="product-info">
                        <div class="product-name">Sample Product ${i + 1}</div>
                        ${customization.productGrid.showPrice ? '<div class="product-price">$99.00</div>' : ''}
                        ${customization.productGrid.showMoq ? '<div style="font-size:0.75rem;color:var(--store-text-muted)">MOQ: 10 units</div>' : ''}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </section>
            `;
          case 'trust-badges':
            return `
              <section class="section">
                <h2 class="section-title">${section.title || 'Why Choose Us'}</h2>
                <div class="trust-badges">
                  ${customization.trustBadges.map(badge => `
                    <div class="trust-badge">
                      <div class="trust-badge-icon">✓</div>
                      <div>
                        <div class="trust-badge-title">${badge.title}</div>
                        <div class="trust-badge-desc">${badge.description}</div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </section>
            `;
          case 'about-block':
            return `
              <section class="section">
                <h2 class="section-title">${section.title || 'About Us'}</h2>
                <div class="about-block">
                  <div class="about-image"></div>
                  <div class="about-text">${customization.aboutUs || sellerDescription || 'Tell your story here...'}</div>
                </div>
              </section>
            `;
          case 'newsletter':
            return `
              <section class="section">
                <div class="newsletter">
                  <h2 class="newsletter-title">${section.title || 'Stay Updated'}</h2>
                  <p>Subscribe to our newsletter for exclusive offers and updates.</p>
                  <div class="newsletter-form">
                    <input type="email" class="newsletter-input" placeholder="Enter your email">
                    <button class="newsletter-btn">Subscribe</button>
                  </div>
                </div>
              </section>
            `;
          case 'testimonials':
            return customization.testimonials.length > 0 ? `
              <section class="section">
                <h2 class="section-title">${section.title || 'What Our Customers Say'}</h2>
                <div class="testimonials-grid">
                  ${customization.testimonials.slice(0, 3).map(t => `
                    <div class="testimonial-card">
                      <p class="testimonial-content">"${t.content}"</p>
                      <div class="testimonial-author">${t.name}${t.company ? `, ${t.company}` : ''}</div>
                    </div>
                  `).join('')}
                </div>
              </section>
            ` : '';
          case 'faq':
            return customization.faq.length > 0 ? `
              <section class="section">
                <h2 class="section-title">${section.title || 'FAQ'}</h2>
                <div class="faq-list">
                  ${customization.faq.map(item => `
                    <div class="faq-item">
                      <div class="faq-question">${item.question}</div>
                      <div class="faq-answer">${item.answer}</div>
                    </div>
                  `).join('')}
                </div>
              </section>
            ` : '';
          default:
            return '';
        }
      }).join('')}
  </main>
  
  <footer class="footer footer-${customization.footer.style}">
    <div class="footer-content">
      ${customization.footer.style === 'detailed' ? `
        <div class="footer-grid">
          <div class="footer-section">
            <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem;">
              ${sellerLogo ? `<img src="${sellerLogo}" alt="${sellerName}" style="width:32px;height:32px;border-radius:8px;">` : ''}
              <span style="font-weight:600;color:white;">${sellerName}</span>
            </div>
            <p>${customization.aboutUs?.slice(0, 150) || sellerDescription || ''}...</p>
          </div>
          <div class="footer-section">
            <h4>Quick Links</h4>
            <ul class="footer-links">
              ${customization.navigation.filter(n => n.visible).slice(0, 5).map(nav => `
                <li><a href="${nav.href}">${nav.label}</a></li>
              `).join('')}
            </ul>
          </div>
          ${customization.contactInfo.email || customization.contactInfo.phone ? `
            <div class="footer-section">
              <h4>Contact</h4>
              <ul class="footer-links">
                ${customization.contactInfo.email ? `<li>${customization.contactInfo.email}</li>` : ''}
                ${customization.contactInfo.phone ? `<li>${customization.contactInfo.phone}</li>` : ''}
                ${customization.contactInfo.address ? `<li>${customization.contactInfo.address}</li>` : ''}
              </ul>
            </div>
          ` : ''}
        </div>
      ` : ''}
      <div class="footer-bottom">
        <p>© ${new Date().getFullYear()} ${sellerName}. All rights reserved.</p>
      </div>
    </div>
  </footer>
</body>
</html>
    `;
  };

  return (
    <div 
      ref={containerRef}
      className={`bg-white rounded-xl border overflow-hidden transition-all duration-300 ${
        isFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : ''
      }`}
    >
      {/* Preview Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <span className="text-sm text-gray-500 ml-2">Live Preview</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Device Switcher */}
          <div className="flex items-center bg-white rounded-lg border p-1">
            <button
              onClick={() => setDevice('desktop')}
              className={`p-1.5 rounded ${device === 'desktop' ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Desktop"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDevice('tablet')}
              className={`p-1.5 rounded ${device === 'tablet' ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Tablet"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDevice('mobile')}
              className={`p-1.5 rounded ${device === 'mobile' ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Mobile"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={handleRefresh}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          
          <a
            href={storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
      
      {/* Preview Frame */}
      <div 
        className={`bg-gray-100 overflow-auto transition-all duration-300 ${
          isFullscreen ? 'h-[calc(100%-52px)]' : 'h-[600px]'
        }`}
      >
        <div 
          className="mx-auto bg-white shadow-lg transition-all duration-300"
          style={{ 
            width: deviceWidths[device],
            maxWidth: '100%',
            minHeight: '100%',
          }}
        >
          <iframe
            key={refreshKey}
            srcDoc={generatePreviewHTML()}
            className="w-full h-full border-0"
            style={{ minHeight: isFullscreen ? 'calc(100vh - 120px)' : '600px' }}
            title="Store Preview"
          />
        </div>
      </div>
    </div>
  );
}
