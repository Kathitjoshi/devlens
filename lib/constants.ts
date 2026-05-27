export const PRESET_TOPICS = [
  { name: 'React', slug: 'react', description: 'A JavaScript library for building user interfaces with components' },
  { name: 'Next.js', slug: 'nextjs', description: 'React framework for production with server-side rendering' },
  { name: 'TypeScript', slug: 'typescript', description: 'Typed superset of JavaScript for safer code' },
  { name: 'JavaScript', slug: 'javascript', description: 'The programming language of the web' },
  { name: 'Python', slug: 'python', description: 'Versatile language for web, data science, and automation' },
  { name: 'Rust', slug: 'rust', description: 'Systems programming language focused on safety and performance' },
  { name: 'Go', slug: 'go', description: 'Efficient language for concurrent and distributed systems' },
  { name: 'Node.js', slug: 'nodejs', description: 'JavaScript runtime for server-side development' },
  { name: 'System Design', slug: 'system-design', description: 'Designing scalable and reliable systems' },
  { name: 'DevOps', slug: 'devops', description: 'Practices for development and operations collaboration' },
  { name: 'Docker', slug: 'docker', description: 'Containerization platform for applications' },
  { name: 'Kubernetes', slug: 'kubernetes', description: 'Container orchestration and management' },
  { name: 'AWS', slug: 'aws', description: 'Amazon Web Services cloud platform' },
  { name: 'Git', slug: 'git', description: 'Version control system for code management' },
  { name: 'CSS', slug: 'css', description: 'Styling language for web design' },
  { name: 'Web Performance', slug: 'web-performance', description: 'Optimizing web applications for speed' },
  { name: 'Database', slug: 'database', description: 'Data storage and management systems' },
  { name: 'GraphQL', slug: 'graphql', description: 'Query language for APIs' },
  { name: 'REST APIs', slug: 'rest-apis', description: 'Architectural style for web services' },
  { name: 'Open Source', slug: 'open-source', description: 'Community-driven software development' },
];

export const BOOKMARK_STATES = {
  READ_LATER: 'read_later',
  FINISHED: 'finished',
} as const;

export const ARTICLE_SOURCES = {
  DEVTO: 'devto',
  HN: 'hn',
} as const;
