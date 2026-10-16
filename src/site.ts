// Single place for company details. Replace the example values with real ones.
export const site = {
  name: '헬로월드',
  description: '헬로월드는 서비스의 설계부터 운영까지 맡는 소프트웨어 개발 회사입니다.',
  // Production origin, no trailing slash (e.g. 'https://example.kr').
  // Canonical links, og:url and sitemap.xml are emitted only when this is set.
  url: '',
  // Business details shown in the footer.
  business: {
    representative: '최욱진',
    registration: '666-53-00669',
    address: '경기도 파주시 술이홀로 409',
  },
};

export const nav = [
  { id: 'about', label: 'About', href: '/about/' },
  { id: 'projects', label: 'Projects', href: '/projects/' },
  { id: 'contact', label: 'Contact', href: '/#contact' },
] as const;
