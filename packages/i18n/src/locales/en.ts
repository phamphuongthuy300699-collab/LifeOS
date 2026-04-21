import type { TranslationDict } from '../types';

/**
 * English translations — mirrors ru.ts structure exactly.
 */
const en: TranslationDict = {
  nav: {
    today: 'Today',
    inbox: 'Inbox',
    workout: 'Workout',
    nutrition: 'Nutrition',
    more: 'More',
  },

  more: {
    learning: 'Learning',
    contacts: 'Contacts',
    projects: 'Projects',
    finance: 'Finance',
    export: 'Export',
    settings: 'Settings',
  },

  actions: {
    add: 'Add',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    done: 'Done',
    archive: 'Archive',
    back: 'Back',
    confirm: 'Confirm',
    reject: 'Reject',
    retry: 'Retry',
    close: 'Close',
    start: 'Start',
    finish: 'Finish',
    skip: 'Skip',
  },

  auth: {
    login: 'Sign in',
    logout: 'Sign out',
    signInWithGoogle: 'Sign in with Google',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot password?',
  },

  today: {
    title: 'Today',
    focusBlock: 'Daily Focus',
    topTasks: 'Top Tasks',
    events: 'Events',
    emailsRequiringAction: 'Emails Requiring Action',
    workoutCard: 'Workout',
    nutritionSummary: 'Nutrition',
    eveningSuggestions: 'Evening Block',
    dayReview: 'Day Review',
  },

  inbox: {
    title: 'Inbox',
    empty: 'No new items',
    quickAdd: 'Quick Add',
    voiceCapture: 'Voice Capture',
    triage: 'Triage',
    triageActions: {
      task: 'Task',
      note: 'Note',
      event: 'Event',
      meal: 'Meal',
      expense: 'Expense',
      contact: 'Contact',
      ignore: 'Ignore',
    },
  },

  tasks: {
    title: 'Tasks',
    newTask: 'New Task',
    status: {
      inbox: 'Inbox',
      todo: 'To Do',
      in_progress: 'In Progress',
      waiting: 'Waiting',
      done: 'Done',
      cancelled: 'Cancelled',
    },
    priority: {
      urgent: 'Urgent',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      none: 'None',
    },
    fields: {
      title: 'Title',
      description: 'Description',
      dueDate: 'Due date',
      project: 'Project',
      priority: 'Priority',
    },
  },

  notes: {
    title: 'Notes',
    newNote: 'New Note',
    untitled: 'Untitled',
  },

  calendar: {
    title: 'Calendar',
    newEvent: 'New Event',
    allDay: 'All day',
    noEvents: 'No events',
  },

  mail: {
    title: 'Mail',
    threads: 'Threads',
    createTask: 'Create task from email',
    markProcessed: 'Mark as processed',
    noMail: 'No emails',
  },

  workout: {
    title: 'Workout',
    plans: 'Workout Plans',
    exercises: 'Exercises',
    startWorkout: 'Start Workout',
    finishWorkout: 'Finish Workout',
    addSet: 'Add Set',
    set: 'Set',
    weight: 'Weight',
    reps: 'Reps',
    rest: 'Rest',
    technique: 'Technique',
    summary: 'Workout Summary',
    previousResult: 'Previous Result',
  },

  nutrition: {
    title: 'Nutrition',
    dailyGoal: 'Daily Goal',
    consumed: 'Consumed',
    remaining: 'Remaining',
    calories: 'Calories',
    protein: 'Protein',
    fat: 'Fat',
    carbs: 'Carbs',
    addMeal: 'Add Meal',
    mealType: {
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      dinner: 'Dinner',
      snack: 'Snack',
      pre_workout: 'Pre-workout',
      post_workout: 'Post-workout',
    },
  },

  learning: {
    title: 'Learning',
    tracks: 'Tracks',
    materials: 'Materials',
    startSession: 'Start Session',
    progress: 'Progress',
  },

  contacts: {
    title: 'Contacts',
    newContact: 'New Contact',
  },

  projects: {
    title: 'Projects',
    newProject: 'New Project',
    nextAction: 'Next Action',
    milestone: 'Milestone',
    status: {
      idea: 'Idea',
      active: 'Active',
      paused: 'Paused',
      completed: 'Completed',
      archived: 'Archived',
    },
  },

  finance: {
    title: 'Finance',
    income: 'Income',
    expense: 'Expense',
    addTransaction: 'Add Transaction',
    summary: 'Summary',
  },

  export: {
    title: 'Export',
    startExport: 'Start Export',
    format: {
      json: 'JSON',
      csv: 'CSV',
      markdown: 'Markdown',
    },
  },

  settings: {
    title: 'Settings',
    profile: 'Profile',
    theme: 'Theme',
    language: 'Language',
    themes: {
      light: 'Light',
      dark: 'Dark',
      system: 'System',
    },
  },

  common: {
    loading: 'Loading...',
    error: 'Error',
    noData: 'No data',
    offline: 'Offline — data saved locally',
    savedLocally: 'Saved locally',
    synced: 'Synced',
  },
};

export default en;
