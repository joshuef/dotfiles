(function() {
  var PackageUpdater;

  PackageUpdater = require('../lib/package-updater');

  require('./spec-helper');

  describe('PackageUpdater', function() {
    afterEach(function() {
      return restoreEnvironment();
    });
    describe('.parseLog', function() {
      var entries;
      entries = null;
      describe('when some updates are done', function() {
        beforeEach(function() {
          var log;
          log = ['Package Updates Available (2)', '└── atom-lint 0.8.0 -> 0.8.1', '└── sort-lines 0.1.0 -> 0.3.0', '', 'Installing atom-lint@0.8.1 to /Users/me/.atom/packages ✓', 'Installing sort-lines@0.3.0 to /Users/me/.atom/packages ✗'].join('\n');
          return entries = PackageUpdater.parseLog(log);
        });
        it('returns entries of package installation', function() {
          return expect(entries.length).toBe(2);
        });
        it('extracts package name', function() {
          expect(entries[0].name).toBe('atom-lint');
          return expect(entries[1].name).toBe('sort-lines');
        });
        it('extracts package version', function() {
          expect(entries[0].version).toBe('0.8.1');
          return expect(entries[1].version).toBe('0.3.0');
        });
        return it('recognizes success and failure', function() {
          expect(entries[0].isInstalled).toBe(true);
          return expect(entries[1].isInstalled).toBe(false);
        });
      });
      describe("when there's no update", function() {
        beforeEach(function() {
          var log;
          log = ['Package Updates Available (0)', '└── (empty)'].join('\n');
          return entries = PackageUpdater.parseLog(log);
        });
        return it('returns empty array', function() {
          return expect(entries.length).toBe(0);
        });
      });
      return describe("when nothing is in the log", function() {
        beforeEach(function() {
          return entries = PackageUpdater.parseLog('');
        });
        return it('returns empty array', function() {
          return expect(entries.length).toBe(0);
        });
      });
    });
    return describe('.generateSummary', function() {
      describe('when no package is updated', function() {
        return it('returns null', function() {
          var entries, summary;
          entries = [
            {
              name: 'atom-lint',
              isInstalled: false
            }
          ];
          summary = PackageUpdater.generateSummary(entries);
          return expect(summary).toBeNull();
        });
      });
      describe('when a packages is updated', function() {
        return it('mentions the packages name', function() {
          var entries, summary;
          entries = [
            {
              name: 'atom-lint',
              isInstalled: true
            }
          ];
          summary = PackageUpdater.generateSummary(entries);
          return expect(summary).toBe('atom-lint has been updated automatically.');
        });
      });
      describe('when 2 packages are updated', function() {
        return it('handles conjugation properly', function() {
          var entries, summary;
          entries = [
            {
              name: 'atom-lint',
              isInstalled: true
            }, {
              name: 'sort-lines',
              isInstalled: true
            }
          ];
          summary = PackageUpdater.generateSummary(entries);
          return expect(summary).toBe('atom-lint and sort-lines have been updated automatically.');
        });
      });
      describe('when more than 2 packages are updated', function() {
        return it('lists the packages names properly', function() {
          var entries, summary;
          entries = [
            {
              name: 'atom-lint',
              isInstalled: true
            }, {
              name: 'sort-lines',
              isInstalled: true
            }, {
              name: 'language-slim',
              isInstalled: true
            }, {
              name: 'language-haskell',
              isInstalled: true
            }
          ];
          summary = PackageUpdater.generateSummary(entries);
          return expect(summary).toBe('atom-lint, sort-lines, language-slim and language-haskell ' + 'have been updated automatically.');
        });
      });
      describe('when more than 5 packages are updated', function() {
        return it('omits the package names', function() {
          var entries, summary;
          entries = [
            {
              name: 'atom-lint',
              isInstalled: true
            }, {
              name: 'sort-lines',
              isInstalled: true
            }, {
              name: 'language-slim',
              isInstalled: true
            }, {
              name: 'language-haskell',
              isInstalled: true
            }, {
              name: 'language-ruby',
              isInstalled: true
            }, {
              name: 'language-python',
              isInstalled: true
            }
          ];
          summary = PackageUpdater.generateSummary(entries);
          return expect(summary).toBe('6 packages have been updated automatically.');
        });
      });
      return describe('when non-auto-update', function() {
        return it('does not say "automatically"', function() {
          var entries, summary;
          entries = [
            {
              name: 'atom-lint',
              isInstalled: true
            }
          ];
          summary = PackageUpdater.generateSummary(entries, false);
          return expect(summary).toBe('atom-lint has been updated.');
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvLmF0b20vcGFja2FnZXMvYXV0by11cGRhdGUtcGFja2FnZXMvc3BlYy9wYWNrYWdlLXVwZGF0ZXItc3BlYy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLGNBQUEsR0FBaUIsT0FBQSxDQUFRLHdCQUFSOztFQUNqQixPQUFBLENBQVEsZUFBUjs7RUFFQSxRQUFBLENBQVMsZ0JBQVQsRUFBMkIsU0FBQTtJQUN6QixTQUFBLENBQVUsU0FBQTthQUNSLGtCQUFBLENBQUE7SUFEUSxDQUFWO0lBR0EsUUFBQSxDQUFTLFdBQVQsRUFBc0IsU0FBQTtBQUNwQixVQUFBO01BQUEsT0FBQSxHQUFVO01BRVYsUUFBQSxDQUFTLDRCQUFULEVBQXVDLFNBQUE7UUFDckMsVUFBQSxDQUFXLFNBQUE7QUFDVCxjQUFBO1VBQUEsR0FBQSxHQUFNLENBQ0osK0JBREksRUFFSiw4QkFGSSxFQUdKLCtCQUhJLEVBSUosRUFKSSxFQUtKLDBEQUxJLEVBTUosMkRBTkksQ0FPTCxDQUFDLElBUEksQ0FPQyxJQVBEO2lCQVVOLE9BQUEsR0FBVSxjQUFjLENBQUMsUUFBZixDQUF3QixHQUF4QjtRQVhELENBQVg7UUFhQSxFQUFBLENBQUcseUNBQUgsRUFBOEMsU0FBQTtpQkFDNUMsTUFBQSxDQUFPLE9BQU8sQ0FBQyxNQUFmLENBQXNCLENBQUMsSUFBdkIsQ0FBNEIsQ0FBNUI7UUFENEMsQ0FBOUM7UUFHQSxFQUFBLENBQUcsdUJBQUgsRUFBNEIsU0FBQTtVQUMxQixNQUFBLENBQU8sT0FBUSxDQUFBLENBQUEsQ0FBRSxDQUFDLElBQWxCLENBQXVCLENBQUMsSUFBeEIsQ0FBNkIsV0FBN0I7aUJBQ0EsTUFBQSxDQUFPLE9BQVEsQ0FBQSxDQUFBLENBQUUsQ0FBQyxJQUFsQixDQUF1QixDQUFDLElBQXhCLENBQTZCLFlBQTdCO1FBRjBCLENBQTVCO1FBSUEsRUFBQSxDQUFH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QUFyQjtRQVY0QixDQUE5QjtNQURnRCxDQUFsRDthQWFBLFFBQUEsQ0FBUyxzQkFBVCxFQUFpQyxTQUFBO2VBQy9CLEVBQUEsQ0FBRyw4QkFBSCxFQUFtQyxTQUFBO0FBQ2pDLGNBQUE7VUFBQSxPQUFBLEdBQVU7WUFDUjtjQUFFLElBQUEsRUFBTSxXQUFSO2NBQXNCLFdBQUEsRUFBYSxJQUFuQzthQURROztVQUdWLE9BQUEsR0FBVSxjQUFjLENBQUMsZUFBZixDQUErQixPQUEvQixFQUF3QyxLQUF4QztpQkFDVixNQUFBLENBQU8sT0FBUCxDQUFlLENBQUMsSUFBaEIsQ0FBcUIsNkJBQXJCO1FBTGlDLENBQW5DO01BRCtCLENBQWpDO0lBbkQyQixDQUE3QjtFQXZEeUIsQ0FBM0I7QUFIQSIsInNvdXJjZXNDb250ZW50IjpbIlBhY2thZ2VVcGRhdGVyID0gcmVxdWlyZSAnLi4vbGliL3BhY2thZ2UtdXBkYXRlcidcbnJlcXVpcmUgJy4vc3BlYy1oZWxwZXInXG5cbmRlc2NyaWJlICdQYWNrYWdlVXBkYXRlcicsIC0+XG4gIGFmdGVyRWFjaCAtPlxuICAgIHJlc3RvcmVFbnZpcm9ubWVudCgpXG5cbiAgZGVzY3JpYmUgJy5wYXJzZUxvZycsIC0+XG4gICAgZW50cmllcyA9IG51bGxcblxuICAgIGRlc2NyaWJlICd3aGVuIHNvbWUgdXBkYXRlcyBhcmUgZG9uZScsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIGxvZyA9IFtcbiAgICAgICAgICAnUGFja2FnZSBVcGRhdGVzIEF2YWlsYWJsZSAoMiknXG4gICAgICAgICAgJ+KUlOKUgOKUgCBhdG9tLWxpbnQgMC44LjAgLT4gMC44LjEnXG4gICAgICAgICAgJ+KUlOKUgOKUgCBzb3J0LWxpbmVzIDAuMS4wIC0+IDAuMy4wJ1xuICAgICAgICAgICcnXG4gICAgICAgICAgJ0luc3RhbGxpbmcgYXRvbS1saW50QDAuOC4xIHRvIC9Vc2Vycy9tZS8uYXRvbS9wYWNrYWdlcyDinJMnXG4gICAgICAgICAgJ0luc3RhbGxpbmcgc29ydC1saW5lc0AwLjMuMCB0byAvVXNlcnMvbWUvLmF0b20vcGFja2FnZXMg4pyXJ1xuICAgICAgICBdLmpvaW4oJ1xcbicpXG5cbiAgICAgICAgIyBcInBhY2thZ2VcIiBpcyBhIHJlc2VydmVkIHdvcmQgaW4gRUNNQVNjcmlwdFxuICAgICAgICBlbnRyaWVzID0gUGFja2FnZVVwZGF0ZXIucGFyc2VMb2cobG9nKVxuXG4gICAgICBpdCAncmV0dXJucyBlbnRyaWVzIG9mIHBhY2thZ2UgaW5zdGFsbGF0aW9uJywgLT5cbiAgICAgICAgZXhwZWN0KGVudHJpZXMubGVuZ3RoKS50b0JlKDIpXG5cbiAgICAgIGl0ICdleHRyYWN0cyBwYWNrYWdlIG5hbWUnLCAtPlxuICAgICAgICBleHBlY3QoZW50cmllc1swXS5uYW1lKS50b0JlKCdhdG9tLWxpbnQnKVxuICAgICAgICBleHBlY3QoZW50cmllc1sxXS5uYW1lKS50b0JlKCdzb3J0LWxpbmVzJylcblxuICAgICAgaXQgJ2V4dHJhY3RzIHBhY2thZ2UgdmVyc2lvbicsIC0+XG4gICAgICAgIGV4cGVjdChlbnRyaWVzWzBdLnZlcnNpb24pLnRvQmUoJzAuOC4xJylcbiAgICAgICAgZXhwZWN0KGVudHJpZXNbMV0udmVyc2lvbikudG9CZSgnMC4zLjAnKVxuXG4gICAgICBpdCAncmVjb2duaXplcyBzdWNjZXNzIGFuZCBmYWlsdXJlJywgLT5cbiAgICAgICAgZXhwZWN0KGVudHJpZXNbMF0uaXNJbnN0YWxsZWQpLnRvQmUodHJ1ZSlcbiAgICAgICAgZXhwZWN0KGVudHJpZXNbMV0uaXNJbnN0YWxsZWQpLnRvQmUoZmFsc2UpXG5cbiAgICBkZXNjcmliZSBcIndoZW4gdGhlcmUncyBubyB1cGRhdGVcIiwgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgbG9nID0gW1xuICAgICAgICAgICdQYWNrYWdlIFVwZGF0ZXMgQXZhaWxhYmxlICgwKSdcbiAgICAgICAgICAn4pSU4pSA4pSAIChlbXB0eSknXG4gICAgICAgIF0uam9pbignXFxuJylcblxuICAgICAgICBlbnRyaWVzID0gUGFja2FnZVVwZGF0ZXIucGFyc2VMb2cobG9nKVxuXG4gICAgICBpdCAncmV0dXJucyBlbXB0eSBhcnJheScsIC0+XG4gICAgICAgIGV4cGVjdChlbnRyaWVzLmxlbmd0aCkudG9CZSgwKVxuXG4gICAgZGVzY3JpYmUgXCJ3aGVuIG5vdGhpbmcgaXMgaW4gdGhlIGxvZ1wiLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBlbnRyaWVzID0gUGFja2FnZVVwZGF0ZXIucGFyc2VMb2coJycpXG5cbiAgICAgIGl0ICdyZXR1cm5zIGVtcHR5IGFycmF5JywgLT5cbiAgICAgICAgZXhwZWN0KGVudHJpZXMubGVuZ3RoKS50b0JlKDApXG5cbiAgZGVzY3JpYmUgJy5nZW5lcmF0ZVN1bW1hcnknLCAtPlxuICAgIGRlc2NyaWJlICd3aGVuIG5vIHBhY2thZ2UgaXMgdXBkYXRlZCcsIC0+XG4gICAgICBpdCAncmV0dXJucyBudWxsJywgLT5cbiAgICAgICAgZW50cmllcyA9IFtcbiAgICAgICAgICB7IG5hbWU6ICdhdG9tLWxpbnQnLCAgaXNJbnN0YWxsZWQ6IGZhbHNlIH1cbiAgICAgICAgXVxuICAgICAgICBzdW1tYXJ5ID0gUGFja2FnZVVwZGF0ZXIuZ2VuZXJhdGVTdW1tYXJ5KGVudHJpZXMpXG4gICAgICAgIGV4cGVjdChzdW1tYXJ5KS50b0JlTnVsbCgpXG5cbiAgICBkZXNjcmliZSAnd2hlbiBhIHBhY2thZ2VzIGlzIHVwZGF0ZWQnLCAtPlxuICAgICAgaXQgJ21lbnRpb25zIHRoZSBwYWNrYWdlcyBuYW1lJywgLT5cbiAgICAgICAgZW50cmllcyA9IFtcbiAgICAgICAgICB7IG5hbWU6ICdhdG9tLWxpbnQnLCAgaXNJbnN0YWxsZWQ6IHRydWUgfVxuICAgICAgICBdXG4gICAgICAgIHN1bW1hcnkgPSBQYWNrYWdlVXBkYXRlci5nZW5lcmF0ZVN1bW1hcnkoZW50cmllcylcbiAgICAgICAgZXhwZWN0KHN1bW1hcnkpLnRvQmUoJ2F0b20tbGludCBoYXMgYmVlbiB1cGRhdGVkIGF1dG9tYXRpY2FsbHkuJylcblxuICAgIGRlc2NyaWJlICd3aGVuIDIgcGFja2FnZXMgYXJlIHVwZGF0ZWQnLCAtPlxuICAgICAgaXQgJ2hhbmRsZXMgY29uanVnYXRpb24gcHJvcGVybHknLCAtPlxuICAgICAgICBlbnRyaWVzID0gW1xuICAgICAgICAgIHsgbmFtZTogJ2F0b20tbGludCcsICBpc0luc3RhbGxlZDogdHJ1ZSB9XG4gICAgICAgICAgeyBuYW1lOiAnc29ydC1saW5lcycsIGlzSW5zdGFsbGVkOiB0cnVlIH1cbiAgICAgICAgXVxuICAgICAgICBzdW1tYXJ5ID0gUGFja2FnZVVwZGF0ZXIuZ2VuZXJhdGVTdW1tYXJ5KGVudHJpZXMpXG4gICAgICAgIGV4cGVjdChzdW1tYXJ5KS50b0JlKCdhdG9tLWxpbnQgYW5kIHNvcnQtbGluZXMgaGF2ZSBiZWVuIHVwZGF0ZWQgYXV0b21hdGljYWxseS4nKVxuXG4gICAgZGVzY3JpYmUgJ3doZW4gbW9yZSB0aGFuIDIgcGFja2FnZXMgYXJlIHVwZGF0ZWQnLCAtPlxuICAgICAgaXQgJ2xpc3RzIHRoZSBwYWNrYWdlcyBuYW1lcyBwcm9wZXJseScsIC0+XG4gICAgICAgIGVudHJpZXMgPSBbXG4gICAgICAgICAgeyBuYW1lOiAnYXRvbS1saW50JywgICAgICAgIGlzSW5zdGFsbGVkOiB0cnVlIH1cbiAgICAgICAgICB7IG5hbWU6ICdzb3J0LWxpbmVzJywgICAgICAgaXNJbnN0YWxsZWQ6IHRydWUgfVxuICAgICAgICAgIHsgbmFtZTogJ2xhbmd1YWdlLXNsaW0nLCAgICBpc0luc3RhbGxlZDogdHJ1ZSB9XG4gICAgICAgICAgeyBuYW1lOiAnbGFuZ3VhZ2UtaGFza2VsbCcsIGlzSW5zdGFsbGVkOiB0cnVlIH1cbiAgICAgICAgXVxuICAgICAgICBzdW1tYXJ5ID0gUGFja2FnZVVwZGF0ZXIuZ2VuZXJhdGVTdW1tYXJ5KGVudHJpZXMpXG4gICAgICAgIGV4cGVjdChzdW1tYXJ5KS50b0JlKCdhdG9tLWxpbnQsIHNvcnQtbGluZXMsIGxhbmd1YWdlLXNsaW0gYW5kIGxhbmd1YWdlLWhhc2tlbGwgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICdoYXZlIGJlZW4gdXBkYXRlZCBhdXRvbWF0aWNhbGx5LicpXG5cbiAgICBkZXNjcmliZSAnd2hlbiBtb3JlIHRoYW4gNSBwYWNrYWdlcyBhcmUgdXBkYXRlZCcsIC0+XG4gICAgICBpdCAnb21pdHMgdGhlIHBhY2thZ2UgbmFtZXMnLCAtPlxuICAgICAgICBlbnRyaWVzID0gW1xuICAgICAgICAgIHsgbmFtZTogJ2F0b20tbGludCcsICAgICAgICBpc0luc3RhbGxlZDogdHJ1ZSB9XG4gICAgICAgICAgeyBuYW1lOiAnc29ydC1saW5lcycsICAgICAgIGlzSW5zdGFsbGVkOiB0cnVlIH1cbiAgICAgICAgICB7IG5hbWU6ICdsYW5ndWFnZS1zbGltJywgICAgaXNJbnN0YWxsZWQ6IHRydWUgfVxuICAgICAgICAgIHsgbmFtZTogJ2xhbmd1YWdlLWhhc2tlbGwnLCBpc0luc3RhbGxlZDogdHJ1ZSB9XG4gICAgICAgICAgeyBuYW1lOiAnbGFuZ3VhZ2UtcnVieScsICAgIGlzSW5zdGFsbGVkOiB0cnVlIH1cbiAgICAgICAgICB7IG5hbWU6ICdsYW5ndWFnZS1weXRob24nLCAgaXNJbnN0YWxsZWQ6IHRydWUgfVxuICAgICAgICBdXG4gICAgICAgIHN1bW1hcnkgPSBQYWNrYWdlVXBkYXRlci5nZW5lcmF0ZVN1bW1hcnkoZW50cmllcylcbiAgICAgICAgZXhwZWN0KHN1bW1hcnkpLnRvQmUoJzYgcGFja2FnZXMgaGF2ZSBiZWVuIHVwZGF0ZWQgYXV0b21hdGljYWxseS4nKVxuXG4gICAgZGVzY3JpYmUgJ3doZW4gbm9uLWF1dG8tdXBkYXRlJywgLT5cbiAgICAgIGl0ICdkb2VzIG5vdCBzYXkgXCJhdXRvbWF0aWNhbGx5XCInLCAtPlxuICAgICAgICBlbnRyaWVzID0gW1xuICAgICAgICAgIHsgbmFtZTogJ2F0b20tbGludCcsICBpc0luc3RhbGxlZDogdHJ1ZSB9XG4gICAgICAgIF1cbiAgICAgICAgc3VtbWFyeSA9IFBhY2thZ2VVcGRhdGVyLmdlbmVyYXRlU3VtbWFyeShlbnRyaWVzLCBmYWxzZSlcbiAgICAgICAgZXhwZWN0KHN1bW1hcnkpLnRvQmUoJ2F0b20tbGludCBoYXMgYmVlbiB1cGRhdGVkLicpXG4iXX0=
