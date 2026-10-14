// Single place for company details. Replace the example values with real ones.
export const site = {
  name: '헬로월드',
  description: '헬로월드는 서비스의 설계부터 운영까지 맡는 소프트웨어 개발 회사입니다.',
  // Business details shown in the footer.
  business: {
    registration: '000-00-00000',
    address: '서울특별시',
  },
};

export const nav = [
  { id: 'about', label: 'About', href: '/about/' },
  { id: 'projects', label: 'Projects', href: '/projects/' },
  { id: 'contact', label: 'Contact', href: '/#contact' },
] as const;
