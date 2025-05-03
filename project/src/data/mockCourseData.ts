import { CourseSection } from '../components/video/CourseOutlineSidebar';

// This would normally come from a backend API
export interface CourseData {
  id: string;
  title: string;
  description: string;
  instructor: string;
  sections: CourseSection[];
}

// Mock course data for the sushi website tutorial
export const sushiWebsiteCourse: CourseData = {
  id: 'sushi-website-tutorial',
  title: 'Creating a Sushi-Themed Website: HTML & CSS Guide for Beginners',
  description: 'Learn to build a beautiful sushi-themed website from scratch using HTML and CSS.',
  instructor: 'Web Dev Master',
  sections: [
    {
      id: 'intro',
      title: 'Intro to Sushi Website Project',
      videoId: 'FazgJVnrVuI',
      completed: true,
      current: false
    },
    {
      id: 'setup',
      title: 'Setup',
      videoId: 'DHvZLI7Db8E',
      completed: true,
      current: false
    },
    {
      id: 'header-navbar',
      title: 'Header & Navbar',
      videoId: 'W6NZfCO5SIk',
      completed: false,
      current: true
    },
    {
      id: 'hero-section',
      title: 'Hero Section',
      videoId: 'dpw9EHDh2bM',
      completed: false,
      current: false
    },
    {
      id: 'about-us-section',
      title: 'About Us Section',
      videoId: 'PkZNo7MFNFg',
      completed: false,
      current: false
    },
    {
      id: 'popular-section',
      title: 'Popular Section',
      videoId: '1Rs2ND1ryYc',
      completed: false,
      current: false
    },
    {
      id: 'animations',
      title: 'Animations',
      videoId: 'jV8B24rSN5o',
      completed: false,
      current: false
    },
    {
      id: 'trending-section',
      title: 'Trending Section',
      videoId: 'X7IBa7vZjmo',
      completed: false,
      current: false
    },
    {
      id: 'newsletter-section',
      title: 'Newsletter Section',
      videoId: 'rWjuiAPkEAw',
      completed: false,
      current: false
    },
    {
      id: 'deployment',
      title: 'Deployment',
      videoId: 'M5QY2_8704o',
      completed: false,
      current: false
    }
  ]
};

// Mock courses collection
export const mockCourses: CourseData[] = [
  sushiWebsiteCourse,
  // Add more courses as needed
];

// Helper function to get a course by ID
export function getCourseById(courseId: string): CourseData | undefined {
  return mockCourses.find(course => course.id === courseId);
}

// Helper function to get the next section in a course
export function getNextSection(courseId: string, currentSectionId: string): CourseSection | undefined {
  const course = getCourseById(courseId);
  if (!course) return undefined;
  
  const currentIndex = course.sections.findIndex(section => section.id === currentSectionId);
  if (currentIndex === -1 || currentIndex === course.sections.length - 1) return undefined;
  
  return course.sections[currentIndex + 1];
}

// Helper function to get the previous section in a course
export function getPrevSection(courseId: string, currentSectionId: string): CourseSection | undefined {
  const course = getCourseById(courseId);
  if (!course) return undefined;
  
  const currentIndex = course.sections.findIndex(section => section.id === currentSectionId);
  if (currentIndex <= 0) return undefined;
  
  return course.sections[currentIndex - 1];
}

// Helper function to get a course section by video ID
export function getCourseSectionByVideoId(videoId: string): { course: CourseData, section: CourseSection } | undefined {
  for (const course of mockCourses) {
    // Find the specific section in the course that matches the videoId
    const section = course.sections.find(section => section.videoId === videoId);
    if (section) {
      // Return both the course and the exact section that matches the videoId
      return { course, section };
    }
  }
  return undefined;
}