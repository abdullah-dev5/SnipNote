import type { NoteTemplate } from '../types/note';

export const BUILTIN_TEMPLATES: NoteTemplate[] = [
  {
    id: 'article',
    name: 'Article',
    note: 'Summary:\n\nKey points:\n- \n\nTakeaways:',
    tags: ['reading'],
  },
  {
    id: 'bug',
    name: 'Bug report',
    note: 'Steps to reproduce:\n1. \n\nExpected:\n\nActual:\n',
    tags: ['bug'],
  },
  {
    id: 'recipe',
    name: 'Recipe',
    note: 'Ingredients:\n- \n\nSteps:\n1. ',
    tags: ['recipe'],
  },
  {
    id: 'idea',
    name: 'Idea',
    note: 'Problem:\n\nIdea:\n\nNext steps:',
    tags: ['idea'],
  },
];
