'use babel';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = {

  excludeLowerPriorityProviders: {

    title: 'Exclude lower priority providers',
    description: 'Whether to exclude lower priority providers (e.g. autocomplete-paths)',
    type: 'boolean',
    'default': false,
    order: 0
  },
  guess: {

    title: 'Guess',
    description: 'When completing a property and no completions are found, Tern will use some heuristics to try and return some properties anyway. Set this to false to turn that off.',
    type: 'boolean',
    'default': true,
    order: 1
  },
  sort: {

    title: 'Sort',
    description: 'Determines whether the result set will be sorted.',
    type: 'boolean',
    'default': true,
    order: 2
  },
  caseInsensitive: {

    title: 'Case-insensitive',
    description: 'Whether to use a case-insensitive compare between the current word and potential completions.',
    type: 'boolean',
    'default': true,
    order: 3
  },
  useSnippets: {

    title: 'Use autocomplete-snippets',
    description: 'Adds snippets to autocomplete+ suggestions',
    type: 'boolean',
    'default': false,
    order: 4
  },
  snippetsFirst: {

    title: 'Display snippets above',
    description: 'Displays snippets above tern suggestions. Requires a restart.',
    type: 'boolean',
    'default': false,
    order: 5
  },
  useSnippetsAndFunction: {

    title: 'Display both, autocomplete-snippets and function name',
    description: 'Choose to just complete the function name or expand the snippet',
    type: 'boolean',
    'default': false,
    order: 6
  },
  inlineFnCompletion: {

    title: 'Display inline suggestions for function params',
    description: 'Displays a inline suggestion located right next to the current cursor',
    type: 'boolean',
    'default': true,
    order: 7
  },
  inlineFnCompletionDocumentation: {

    title: 'Display inline suggestions with additional documentation (if any)',
    description: 'Adds documentation to the inline function completion',
    type: 'boolean',
    'default': false,
    order: 8
  },
  documentation: {

    title: 'Documentation',
    description: 'Whether to include documentation string (if found) in the result data.',
    type: 'boolean',
    'default': true,
    order: 9
  },
  urls: {

    title: 'Url',
    description: 'Whether to include documentation urls (if found) in the result data.',
    type: 'boolean',
    'default': true,
    order: 10
  },
  origins: {

    title: 'Origin',
    description: 'Whether to include origins (if found) in the result data.',
    type: 'boolean',
    'default': true,
    order: 11
  },
  ternServerGetFileAsync: {

    title: 'Tern Server getFile async',
    description: 'Indicates whether getFile is asynchronous. Default is true. Requires a restart.',
    type: 'boolean',
    'default': true,
    order: 12
  },
  ternServerDependencyBudget: {

    title: 'Tern Server dependency-budget',
    description: 'http://ternjs.net/doc/manual.html#dependency_budget. Requires a restart.',
    type: 'number',
    'default': 20000,
    order: 13
  },
  debug: {

    title: 'Debug',
    description: 'Display debug information in console.',
    type: 'boolean',
    'default': true,
    order: 14
  }
};
module.exports = exports['default'];
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qb3NoL2RvdGZpbGVzL2F0b20vcGFja2FnZXMvYXRvbS10ZXJuanMvbGliL2NvbmZpZy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxXQUFXLENBQUM7Ozs7O3FCQUVHOztBQUViLCtCQUE2QixFQUFFOztBQUU3QixTQUFLLEVBQUUsa0NBQWtDO0FBQ3pDLGVBQVcsRUFBRSx1RUFBdUU7QUFDcEYsUUFBSSxFQUFFLFNBQVM7QUFDZixlQUFTLEtBQUs7QUFDZCxTQUFLLEVBQUUsQ0FBQztHQUNUO0FBQ0QsT0FBSyxFQUFFOztBQUVMLFNBQUssRUFBRSxPQUFPO0FBQ2QsZUFBVyxFQUFFLHNLQUFzSztBQUNuTCxRQUFJLEVBQUUsU0FBUztBQUNmLGVBQVMsSUFBSTtBQUNiLFNBQUssRUFBRSxDQUFDO0dBQ1Q7QUFDRCxNQUFJLEVBQUU7O0FBRUosU0FBSyxFQUFFLE1BQU07QUFDYixlQUFXLEVBQUUsbURBQW1EO0FBQ2hFLFFBQUksRUFBRSxTQUFTO0FBQ2YsZUFBUyxJQUFJO0FBQ2IsU0FBSyxFQUFFLENBQUM7R0FDVDtBQUNELGlCQUFlLEVBQUU7O0FBRWYsU0FBSyxFQUFFLGtCQUFrQjtBQUN6QixlQUFXLEVBQUUsK0ZBQStGO0FBQzVHLFFBQUksRUFBRSxTQUFTO0FBQ2YsZUFBUyxJQUFJO0FBQ2IsU0FBSyxFQUFFLENBQUM7R0FDVDtBQUNELGFBQVcsRUFBRTs7QUFFWCxTQUFLLEVBQUUsMkJBQTJCO0FBQ2xDLGVBQVcsRUFBRSw0Q0FBNEM7QUFDekQsUUFBSSxFQUFFLFNBQVM7QUFDZixlQUFTLEtBQUs7QUFDZCxTQUFLLEVBQUUsQ0FBQztHQUNUO0FBQ0QsZUFBYSxFQUFFOztBQUViLFNBQUssRUFBRSx3QkFBd0I7QUFDL0IsZUFBVyxFQUFFLCtEQUErRDtBQUM1RSxRQUFJLEVBQUUsU0FBUztBQUNmLGVBQVMsS0FBSztBQUNkLFNBQUssRUFBRSxDQUFDO0dBQ1Q7QUFDRCx3QkFBc0IsRUFBRTs7QUFFdEIsU0FBSyxFQUFFLHVEQUF1RDtBQUM5RCxlQUFXLEVBQUUsaUVBQWlFO0FBQzlFLFFBQUksRUFBRSxTQUFTO0FBQ2YsZUFBUyxLQUFLO0FBQ2QsU0FBSyxFQUFFLENBQUM7R0FDVDtBQUNELG9CQUFrQixFQUFFOztBQUVsQixTQUFLLEVBQUUsZ0RBQWdEO0FBQ3ZELGVBQVcsRUFBRSx1RUFBdUU7QUFDcEYsUUFBSSxFQUFFLFNBQVM7QUFDZixlQUFTLElBQUk7QUFDYixTQUFLLEVBQUUsQ0FBQztHQUNUO0FBQ0QsaUNBQStCLEVBQUU7O0FBRS9CLFNBQUssRUFBRSxtRUFBbUU7QUFDMUUsZUFBVyxFQUFFLHNEQUFzRDtBQUNuRSxRQUFJLEVBQUUsU0FBUztBQUNmLGVBQVMsS0FBSztBQUNkLFNBQUssRUFBRSxDQUFDO0dBQ1Q7QUFDRCxlQUFhLEVBQUU7O0FBRWIsU0FBSyxFQUFFLGVBQWU7QUFDdEIsZUFBVyxFQUFFLHdFQUF3RTtBQUNyRixRQUFJLEVBQUUsU0FBUztBQUNmLGVBQVMsSUFBSTtBQUNiLFNBQUssRUFBRSxDQUFDO0dBQ1Q7QUFDRCxNQUFJLEVBQUU7O0FBRUosU0FBSyxFQUFFLEtBQUs7QUFDWixlQUFXLEVBQUUsc0VBQXNFO0FBQ25GLFFBQUksRUFBRSxTQUFTO0FBQ2YsZUFBUyxJQUFJO0FBQ2IsU0FBSyxFQUFFLEVBQUU7R0FDVjtBQUNELFNBQU8sRUFBRTs7QUFFUCxTQUFLLEVBQUUsUUFBUTtBQUNmLGVBQVcsRUFBRSwyREFBMkQ7QUFDeEUsUUFBSSxFQUFFLFNBQVM7QUFDZixlQUFTLElBQUk7QUFDYixTQUFLLEVBQUUsRUFBRTtHQUNWO0FBQ0Qsd0JBQXNCLEVBQUU7O0FBRXRCLFNBQUssRUFBRSwyQkFBMkI7QUFDbEMsZUFBVyxFQUFFLGlGQUFpRjtBQUM5RixRQUFJLEVBQUUsU0FBUztBQUNmLGVBQVMsSUFBSTtBQUNiLFNBQUssRUFBRSxFQUFFO0dBQ1Y7QUFDRCw0QkFBMEIsRUFBRTs7QUFFMUIsU0FBSyxFQUFFLCtCQUErQjtBQUN0QyxlQUFXLEVBQUUsMEVBQTBFO0FBQ3ZGLFFBQUksRUFBRSxRQUFRO0FBQ2QsZUFBUyxLQUFLO0FBQ2QsU0FBSyxFQUFFLEVBQUU7R0FDVjtBQUNELE9BQUssRUFBRTs7QUFFTCxTQUFLLEVBQUUsT0FBTztBQUNkLGVBQVcsRUFBRSx1Q0FBdUM7QUFDcEQsUUFBSSxFQUFFLFNBQVM7QUFDZixlQUFTLElBQUk7QUFDYixTQUFLLEVBQUUsRUFBRTtHQUNWO0NBQ0YiLCJmaWxlIjoiL1VzZXJzL2pvc2gvZG90ZmlsZXMvYXRvbS9wYWNrYWdlcy9hdG9tLXRlcm5qcy9saWIvY29uZmlnLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBiYWJlbCc7XG5cbmV4cG9ydCBkZWZhdWx0IHtcblxuICBleGNsdWRlTG93ZXJQcmlvcml0eVByb3ZpZGVyczoge1xuXG4gICAgdGl0bGU6ICdFeGNsdWRlIGxvd2VyIHByaW9yaXR5IHByb3ZpZGVycycsXG4gICAgZGVzY3JpcHRpb246ICdXaGV0aGVyIHRvIGV4Y2x1ZGUgbG93ZXIgcHJpb3JpdHkgcHJvdmlkZXJzIChlLmcuIGF1dG9jb21wbGV0ZS1wYXRocyknLFxuICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICBvcmRlcjogMFxuICB9LFxuICBndWVzczoge1xuXG4gICAgdGl0bGU6ICdHdWVzcycsXG4gICAgZGVzY3JpcHRpb246ICdXaGVuIGNvbXBsZXRpbmcgYSBwcm9wZXJ0eSBhbmQgbm8gY29tcGxldGlvbnMgYXJlIGZvdW5kLCBUZXJuIHdpbGwgdXNlIHNvbWUgaGV1cmlzdGljcyB0byB0cnkgYW5kIHJldHVybiBzb21lIHByb3BlcnRpZXMgYW55d2F5LiBTZXQgdGhpcyB0byBmYWxzZSB0byB0dXJuIHRoYXQgb2ZmLicsXG4gICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgb3JkZXI6IDFcbiAgfSxcbiAgc29ydDoge1xuXG4gICAgdGl0bGU6ICdTb3J0JyxcbiAgICBkZXNjcmlwdGlvbjogJ0RldGVybWluZXMgd2hldGhlciB0aGUgcmVzdWx0IHNldCB3aWxsIGJlIHNvcnRlZC4nLFxuICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICBkZWZhdWx0OiB0cnVlLFxuICAgIG9yZGVyOiAyXG4gIH0sXG4gIGNhc2VJbnNlbnNpdGl2ZToge1xuXG4gICAgdGl0bGU6ICdDYXNlLWluc2Vuc2l0aXZlJyxcbiAgICBkZXNjcmlwdGlvbjogJ1doZXRoZXIgdG8gdXNlIGEgY2FzZS1pbnNlbnNpdGl2ZSBjb21wYXJlIGJldHdlZW4gdGhlIGN1cnJlbnQgd29yZCBhbmQgcG90ZW50aWFsIGNvbXBsZXRpb25zLicsXG4gICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgb3JkZXI6IDNcbiAgfSxcbiAgdXNlU25pcHBldHM6IHtcblxuICAgIHRpdGxlOiAnVXNlIGF1dG9jb21wbGV0ZS1zbmlwcGV0cycsXG4gICAgZGVzY3JpcHRpb246ICdBZGRzIHNuaXBwZXRzIHRvIGF1dG9jb21wbGV0ZSsgc3VnZ2VzdGlvbnMnLFxuICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICBvcmRlcjogNFxuICB9LFxuICBzbmlwcGV0c0ZpcnN0OiB7XG5cbiAgICB0aXRsZTogJ0Rpc3BsYXkgc25pcHBldHMgYWJvdmUnLFxuICAgIGRlc2NyaXB0aW9uOiAnRGlzcGxheXMgc25pcHBldHMgYWJvdmUgdGVybiBzdWdnZXN0aW9ucy4gUmVxdWlyZXMgYSByZXN0YXJ0LicsXG4gICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgIGRlZmF1bHQ6IGZhbHNlLFxuICAgIG9yZGVyOiA1XG4gIH0sXG4gIHVzZVNuaXBwZXRzQW5kRnVuY3Rpb246IHtcblxuICAgIHRpdGxlOiAnRGlzcGxheSBib3RoLCBhdXRvY29tcGxldGUtc25pcHBldHMgYW5kIGZ1bmN0aW9uIG5hbWUnLFxuICAgIGRlc2NyaXB0aW9uOiAnQ2hvb3NlIHRvIGp1c3QgY29tcGxldGUgdGhlIGZ1bmN0aW9uIG5hbWUgb3IgZXhwYW5kIHRoZSBzbmlwcGV0JyxcbiAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgZGVmYXVsdDogZmFsc2UsXG4gICAgb3JkZXI6IDZcbiAgfSxcbiAgaW5saW5lRm5Db21wbGV0aW9uOiB7XG5cbiAgICB0aXRsZTogJ0Rpc3BsYXkgaW5saW5lIHN1Z2dlc3Rpb25zIGZvciBmdW5jdGlvbiBwYXJhbXMnLFxuICAgIGRlc2NyaXB0aW9uOiAnRGlzcGxheXMgYSBpbmxpbmUgc3VnZ2VzdGlvbiBsb2NhdGVkIHJpZ2h0IG5leHQgdG8gdGhlIGN1cnJlbnQgY3Vyc29yJyxcbiAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgZGVmYXVsdDogdHJ1ZSxcbiAgICBvcmRlcjogN1xuICB9LFxuICBpbmxpbmVGbkNvbXBsZXRpb25Eb2N1bWVudGF0aW9uOiB7XG5cbiAgICB0aXRsZTogJ0Rpc3BsYXkgaW5saW5lIHN1Z2dlc3Rpb25zIHdpdGggYWRkaXRpb25hbCBkb2N1bWVudGF0aW9uIChpZiBhbnkpJyxcbiAgICBkZXNjcmlwdGlvbjogJ0FkZHMgZG9jdW1lbnRhdGlvbiB0byB0aGUgaW5saW5lIGZ1bmN0aW9uIGNvbXBsZXRpb24nLFxuICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICBkZWZhdWx0OiBmYWxzZSxcbiAgICBvcmRlcjogOFxuICB9LFxuICBkb2N1bWVudGF0aW9uOiB7XG5cbiAgICB0aXRsZTogJ0RvY3VtZW50YXRpb24nLFxuICAgIGRlc2NyaXB0aW9uOiAnV2hldGhlciB0byBpbmNsdWRlIGRvY3VtZW50YXRpb24gc3RyaW5nIChpZiBmb3VuZCkgaW4gdGhlIHJlc3VsdCBkYXRhLicsXG4gICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgb3JkZXI6IDlcbiAgfSxcbiAgdXJsczoge1xuXG4gICAgdGl0bGU6ICdVcmwnLFxuICAgIGRlc2NyaXB0aW9uOiAnV2hldGhlciB0byBpbmNsdWRlIGRvY3VtZW50YXRpb24gdXJscyAoaWYgZm91bmQpIGluIHRoZSByZXN1bHQgZGF0YS4nLFxuICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICBkZWZhdWx0OiB0cnVlLFxuICAgIG9yZGVyOiAxMFxuICB9LFxuICBvcmlnaW5zOiB7XG5cbiAgICB0aXRsZTogJ09yaWdpbicsXG4gICAgZGVzY3JpcHRpb246ICdXaGV0aGVyIHRvIGluY2x1ZGUgb3JpZ2lucyAoaWYgZm91bmQpIGluIHRoZSByZXN1bHQgZGF0YS4nLFxuICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICBkZWZhdWx0OiB0cnVlLFxuICAgIG9yZGVyOiAxMVxuICB9LFxuICB0ZXJuU2VydmVyR2V0RmlsZUFzeW5jOiB7XG5cbiAgICB0aXRsZTogJ1Rlcm4gU2VydmVyIGdldEZpbGUgYXN5bmMnLFxuICAgIGRlc2NyaXB0aW9uOiAnSW5kaWNhdGVzIHdoZXRoZXIgZ2V0RmlsZSBpcyBhc3luY2hyb25vdXMuIERlZmF1bHQgaXMgdHJ1ZS4gUmVxdWlyZXMgYSByZXN0YXJ0LicsXG4gICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgIGRlZmF1bHQ6IHRydWUsXG4gICAgb3JkZXI6IDEyXG4gIH0sXG4gIHRlcm5TZXJ2ZXJEZXBlbmRlbmN5QnVkZ2V0OiB7XG5cbiAgICB0aXRsZTogJ1Rlcm4gU2VydmVyIGRlcGVuZGVuY3ktYnVkZ2V0JyxcbiAgICBkZXNjcmlwdGlvbjogJ2h0dHA6Ly90ZXJuanMubmV0L2RvYy9tYW51YWwuaHRtbCNkZXBlbmRlbmN5X2J1ZGdldC4gUmVxdWlyZXMgYSByZXN0YXJ0LicsXG4gICAgdHlwZTogJ251bWJlcicsXG4gICAgZGVmYXVsdDogMjAwMDAsXG4gICAgb3JkZXI6IDEzXG4gIH0sXG4gIGRlYnVnOiB7XG5cbiAgICB0aXRsZTogJ0RlYnVnJyxcbiAgICBkZXNjcmlwdGlvbjogJ0Rpc3BsYXkgZGVidWcgaW5mb3JtYXRpb24gaW4gY29uc29sZS4nLFxuICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICBkZWZhdWx0OiB0cnVlLFxuICAgIG9yZGVyOiAxNFxuICB9LFxufTtcbiJdfQ==