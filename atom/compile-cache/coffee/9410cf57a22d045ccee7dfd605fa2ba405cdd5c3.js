(function() {
  var AutoUpdatePackages, PackageUpdater, fs;

  fs = require('fs');

  AutoUpdatePackages = require('../lib/auto-update-packages');

  PackageUpdater = require('../lib/package-updater');

  require('./spec-helper');

  describe('auto-upgrade-packages', function() {
    afterEach(function() {
      return restoreEnvironment();
    });
    describe('.loadLastUpdateTime', function() {
      describe('when no update has done ever', function() {
        beforeEach(function() {
          var path;
          path = AutoUpdatePackages.getLastUpdateTimeFilePath();
          if (fs.existsSync(path)) {
            return fs.unlinkSync(path);
          }
        });
        return it('returns null', function() {
          return expect(AutoUpdatePackages.loadLastUpdateTime()).toBeNull();
        });
      });
      return describe('when any update has done ever', function() {
        beforeEach(function() {
          return AutoUpdatePackages.saveLastUpdateTime();
        });
        return it('returns the time', function() {
          var loadedTime, now;
          loadedTime = AutoUpdatePackages.loadLastUpdateTime();
          now = Date.now();
          expect(loadedTime).toBeLessThan(now + 1);
          return expect(loadedTime).toBeGreaterThan(now - 1000);
        });
      });
    });
    describe('.updatePackagesIfAutoUpdateBlockIsExpired', function() {
      describe('when no update has done ever', function() {
        beforeEach(function() {
          var path;
          path = AutoUpdatePackages.getLastUpdateTimeFilePath();
          if (fs.existsSync(path)) {
            return fs.unlinkSync(path);
          }
        });
        return it('runs update', function() {
          spyOn(AutoUpdatePackages, 'updatePackages');
          AutoUpdatePackages.updatePackagesIfAutoUpdateBlockIsExpired();
          return expect(AutoUpdatePackages.updatePackages).toHaveBeenCalled();
        });
      });
      return describe('when a update has done just now', function() {
        beforeEach(function() {
          spyOn(PackageUpdater, 'updatePackages');
          return AutoUpdatePackages.updatePackagesIfAutoUpdateBlockIsExpired();
        });
        return it('does not run update', function() {
          spyOn(AutoUpdatePackages, 'updatePackages');
          AutoUpdatePackages.updatePackagesIfAutoUpdateBlockIsExpired();
          return expect(AutoUpdatePackages.updatePackages).not.toHaveBeenCalled();
        });
      });
    });
    describe('.getAutoUpdateBlockDuration', function() {
      describe('when "auto-update-packages.intervalMinutes" is 360', function() {
        beforeEach(function() {
          return atom.config.set('auto-update-packages.intervalMinutes', 360);
        });
        return it('returns 21600000 (6 hours)', function() {
          return expect(AutoUpdatePackages.getAutoUpdateBlockDuration()).toBe(21600000);
        });
      });
      describe('when "auto-update-packages.intervalMinutes" is 30', function() {
        beforeEach(function() {
          return atom.config.set('auto-update-packages.intervalMinutes', 30);
        });
        return it('returns 1800000', function() {
          return expect(AutoUpdatePackages.getAutoUpdateBlockDuration()).toBe(1800000);
        });
      });
      return describe('when "auto-update-packages.intervalMinutes" is 14', function() {
        beforeEach(function() {
          return atom.config.set('auto-update-packages.intervalMinutes', 14);
        });
        return it('returns 900000 (15 minutes) to avoid too frequent access to the server', function() {
          return expect(AutoUpdatePackages.getAutoUpdateBlockDuration()).toBe(900000);
        });
      });
    });
    return describe('.getAutoUpdateCheckInterval', function() {
      describe('when "auto-update-packages.intervalMinutes" is 360', function() {
        beforeEach(function() {
          return atom.config.set('auto-update-packages.intervalMinutes', 360);
        });
        return it('returns 1440000 (24 minutes)', function() {
          return expect(AutoUpdatePackages.getAutoUpdateCheckInterval()).toBe(1440000);
        });
      });
      return describe('when "auto-update-packages.intervalMinutes" is 30', function() {
        beforeEach(function() {
          return atom.config.set('auto-update-packages.intervalMinutes', 30);
        });
        return it('returns 120000 (2 minutes)', function() {
          return expect(AutoUpdatePackages.getAutoUpdateCheckInterval()).toBe(120000);
        });
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvLmF0b20vcGFja2FnZXMvYXV0by11cGRhdGUtcGFja2FnZXMvc3BlYy9hdXRvLXVwZGF0ZS1wYWNrYWdlcy1zcGVjLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsRUFBQSxHQUFLLE9BQUEsQ0FBUSxJQUFSOztFQUNMLGtCQUFBLEdBQXFCLE9BQUEsQ0FBUSw2QkFBUjs7RUFDckIsY0FBQSxHQUFpQixPQUFBLENBQVEsd0JBQVI7O0VBQ2pCLE9BQUEsQ0FBUSxlQUFSOztFQUVBLFFBQUEsQ0FBUyx1QkFBVCxFQUFrQyxTQUFBO0lBQ2hDLFNBQUEsQ0FBVSxTQUFBO2FBQ1Isa0JBQUEsQ0FBQTtJQURRLENBQVY7SUFHQSxRQUFBLENBQVMscUJBQVQsRUFBZ0MsU0FBQTtNQUM5QixRQUFBLENBQVMsOEJBQVQsRUFBeUMsU0FBQTtRQUN2QyxVQUFBLENBQVcsU0FBQTtBQUNULGNBQUE7VUFBQSxJQUFBLEdBQU8sa0JBQWtCLENBQUMseUJBQW5CLENBQUE7VUFDUCxJQUF1QixFQUFFLENBQUMsVUFBSCxDQUFjLElBQWQsQ0FBdkI7bUJBQUEsRUFBRSxDQUFDLFVBQUgsQ0FBYyxJQUFkLEVBQUE7O1FBRlMsQ0FBWDtlQUlBLEVBQUEsQ0FBRyxjQUFILEVBQW1CLFNBQUE7aUJBQ2pCLE1BQUEsQ0FBTyxrQkFBa0IsQ0FBQyxrQkFBbkIsQ0FBQSxDQUFQLENBQStDLENBQUMsUUFBaEQsQ0FBQTtRQURpQixDQUFuQjtNQUx1QyxDQUF6QzthQVFBLFFBQUEsQ0FBUywrQkFBVCxFQUEwQyxTQUFBO1FBQ3hDLFVBQUEsQ0FBVyxTQUFBO2lCQUNULGtCQUFrQixDQUFDLGtCQUFuQixDQUFBO1FBRFMsQ0FBWDtlQUdBLEVBQUEsQ0FBRyxrQkFBSCxFQUF1QixTQUFBO0FBQ3JCLGNBQUE7VUFBQSxVQUFBLEdBQWEsa0JBQWtCLENBQUMsa0JBQW5CLENBQUE7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QkFDVCxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQVosQ0FBZ0Isc0NBQWhCLEVBQXdELEdBQXhEO1FBRFMsQ0FBWDtlQUdBLEVBQUEsQ0FBRyw4QkFBSCxFQUFtQyxTQUFBO2lCQUNqQyxNQUFBLENBQU8sa0JBQWtCLENBQUMsMEJBQW5CLENBQUEsQ0FBUCxDQUF1RCxDQUFDLElBQXhELENBQTZELE9BQTdEO1FBRGlDLENBQW5DO01BSjZELENBQS9EO2FBT0EsUUFBQSxDQUFTLG1EQUFULEVBQThELFNBQUE7UUFDNUQsVUFBQSxDQUFXLFNBQUE7aUJBQ1QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFaLENBQWdCLHNDQUFoQixFQUF3RCxFQUF4RDtRQURTLENBQVg7ZUFHQSxFQUFBLENBQUcsNEJBQUgsRUFBaUMsU0FBQTtpQkFDL0IsTUFBQSxDQUFPLGtCQUFrQixDQUFDLDBCQUFuQixDQUFBLENBQVAsQ0FBdUQsQ0FBQyxJQUF4RCxDQUE2RCxNQUE3RDtRQUQrQixDQUFqQztNQUo0RCxDQUE5RDtJQVJzQyxDQUF4QztFQW5FZ0MsQ0FBbEM7QUFMQSIsInNvdXJjZXNDb250ZW50IjpbImZzID0gcmVxdWlyZSAnZnMnXG5BdXRvVXBkYXRlUGFja2FnZXMgPSByZXF1aXJlICcuLi9saWIvYXV0by11cGRhdGUtcGFja2FnZXMnXG5QYWNrYWdlVXBkYXRlciA9IHJlcXVpcmUgJy4uL2xpYi9wYWNrYWdlLXVwZGF0ZXInXG5yZXF1aXJlICcuL3NwZWMtaGVscGVyJ1xuXG5kZXNjcmliZSAnYXV0by11cGdyYWRlLXBhY2thZ2VzJywgLT5cbiAgYWZ0ZXJFYWNoIC0+XG4gICAgcmVzdG9yZUVudmlyb25tZW50KClcblxuICBkZXNjcmliZSAnLmxvYWRMYXN0VXBkYXRlVGltZScsIC0+XG4gICAgZGVzY3JpYmUgJ3doZW4gbm8gdXBkYXRlIGhhcyBkb25lIGV2ZXInLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBwYXRoID0gQXV0b1VwZGF0ZVBhY2thZ2VzLmdldExhc3RVcGRhdGVUaW1lRmlsZVBhdGgoKVxuICAgICAgICBmcy51bmxpbmtTeW5jKHBhdGgpIGlmIGZzLmV4aXN0c1N5bmMocGF0aClcblxuICAgICAgaXQgJ3JldHVybnMgbnVsbCcsIC0+XG4gICAgICAgIGV4cGVjdChBdXRvVXBkYXRlUGFja2FnZXMubG9hZExhc3RVcGRhdGVUaW1lKCkpLnRvQmVOdWxsKClcblxuICAgIGRlc2NyaWJlICd3aGVuIGFueSB1cGRhdGUgaGFzIGRvbmUgZXZlcicsIC0+XG4gICAgICBiZWZvcmVFYWNoIC0+XG4gICAgICAgIEF1dG9VcGRhdGVQYWNrYWdlcy5zYXZlTGFzdFVwZGF0ZVRpbWUoKVxuXG4gICAgICBpdCAncmV0dXJucyB0aGUgdGltZScsIC0+XG4gICAgICAgIGxvYWRlZFRpbWUgPSBBdXRvVXBkYXRlUGFja2FnZXMubG9hZExhc3RVcGRhdGVUaW1lKClcbiAgICAgICAgbm93ID0gRGF0ZS5ub3coKVxuICAgICAgICAjIHRvQmVDbG9zZVRvIG1hdGNoZXIgYWxsb3dzIG9ubHkgZGVjaW1hbCBudW1iZXJzLlxuICAgICAgICBleHBlY3QobG9hZGVkVGltZSkudG9CZUxlc3NUaGFuKG5vdyArIDEpXG4gICAgICAgIGV4cGVjdChsb2FkZWRUaW1lKS50b0JlR3JlYXRlclRoYW4obm93IC0gMTAwMClcblxuICBkZXNjcmliZSAnLnVwZGF0ZVBhY2thZ2VzSWZBdXRvVXBkYXRlQmxvY2tJc0V4cGlyZWQnLCAtPlxuICAgIGRlc2NyaWJlICd3aGVuIG5vIHVwZGF0ZSBoYXMgZG9uZSBldmVyJywgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgcGF0aCA9IEF1dG9VcGRhdGVQYWNrYWdlcy5nZXRMYXN0VXBkYXRlVGltZUZpbGVQYXRoKClcbiAgICAgICAgZnMudW5saW5rU3luYyhwYXRoKSBpZiBmcy5leGlzdHNTeW5jKHBhdGgpXG5cbiAgICAgIGl0ICdydW5zIHVwZGF0ZScsIC0+XG4gICAgICAgIHNweU9uKEF1dG9VcGRhdGVQYWNrYWdlcywgJ3VwZGF0ZVBhY2thZ2VzJylcbiAgICAgICAgQXV0b1VwZGF0ZVBhY2thZ2VzLnVwZGF0ZVBhY2thZ2VzSWZBdXRvVXBkYXRlQmxvY2tJc0V4cGlyZWQoKVxuICAgICAgICBleHBlY3QoQXV0b1VwZGF0ZVBhY2thZ2VzLnVwZGF0ZVBhY2thZ2VzKS50b0hhdmVCZWVuQ2FsbGVkKClcblxuICAgIGRlc2NyaWJlICd3aGVuIGEgdXBkYXRlIGhhcyBkb25lIGp1c3Qgbm93JywgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgc3B5T24oUGFja2FnZVVwZGF0ZXIsICd1cGRhdGVQYWNrYWdlcycpXG4gICAgICAgIEF1dG9VcGRhdGVQYWNrYWdlcy51cGRhdGVQYWNrYWdlc0lmQXV0b1VwZGF0ZUJsb2NrSXNFeHBpcmVkKClcblxuICAgICAgaXQgJ2RvZXMgbm90IHJ1biB1cGRhdGUnLCAtPlxuICAgICAgICBzcHlPbihBdXRvVXBkYXRlUGFja2FnZXMsICd1cGRhdGVQYWNrYWdlcycpXG4gICAgICAgIEF1dG9VcGRhdGVQYWNrYWdlcy51cGRhdGVQYWNrYWdlc0lmQXV0b1VwZGF0ZUJsb2NrSXNFeHBpcmVkKClcbiAgICAgICAgZXhwZWN0KEF1dG9VcGRhdGVQYWNrYWdlcy51cGRhdGVQYWNrYWdlcykubm90LnRvSGF2ZUJlZW5DYWxsZWQoKVxuXG4gIGRlc2NyaWJlICcuZ2V0QXV0b1VwZGF0ZUJsb2NrRHVyYXRpb24nLCAtPlxuICAgIGRlc2NyaWJlICd3aGVuIFwiYXV0by11cGRhdGUtcGFja2FnZXMuaW50ZXJ2YWxNaW51dGVzXCIgaXMgMzYwJywgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgYXRvbS5jb25maWcuc2V0KCdhdXRvLXVwZGF0ZS1wYWNrYWdlcy5pbnRlcnZhbE1pbnV0ZXMnLCAzNjApXG5cbiAgICAgIGl0ICdyZXR1cm5zIDIxNjAwMDAwICg2IGhvdXJzKScsIC0+XG4gICAgICAgIGV4cGVjdChBdXRvVXBkYXRlUGFja2FnZXMuZ2V0QXV0b1VwZGF0ZUJsb2NrRHVyYXRpb24oKSkudG9CZSgyMTYwMDAwMClcblxuICAgIGRlc2NyaWJlICd3aGVuIFwiYXV0by11cGRhdGUtcGFja2FnZXMuaW50ZXJ2YWxNaW51dGVzXCIgaXMgMzAnLCAtPlxuICAgICAgYmVmb3JlRWFjaCAtPlxuICAgICAgICBhdG9tLmNvbmZpZy5zZXQoJ2F1dG8tdXBkYXRlLXBhY2thZ2VzLmludGVydmFsTWludXRlcycsIDMwKVxuXG4gICAgICBpdCAncmV0dXJucyAxODAwMDAwJywgLT5cbiAgICAgICAgZXhwZWN0KEF1dG9VcGRhdGVQYWNrYWdlcy5nZXRBdXRvVXBkYXRlQmxvY2tEdXJhdGlvbigpKS50b0JlKDE4MDAwMDApXG5cbiAgICBkZXNjcmliZSAnd2hlbiBcImF1dG8tdXBkYXRlLXBhY2thZ2VzLmludGVydmFsTWludXRlc1wiIGlzIDE0JywgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgYXRvbS5jb25maWcuc2V0KCdhdXRvLXVwZGF0ZS1wYWNrYWdlcy5pbnRlcnZhbE1pbnV0ZXMnLCAxNClcblxuICAgICAgaXQgJ3JldHVybnMgOTAwMDAwICgxNSBtaW51dGVzKSB0byBhdm9pZCB0b28gZnJlcXVlbnQgYWNjZXNzIHRvIHRoZSBzZXJ2ZXInLCAtPlxuICAgICAgICBleHBlY3QoQXV0b1VwZGF0ZVBhY2thZ2VzLmdldEF1dG9VcGRhdGVCbG9ja0R1cmF0aW9uKCkpLnRvQmUoOTAwMDAwKVxuXG4gIGRlc2NyaWJlICcuZ2V0QXV0b1VwZGF0ZUNoZWNrSW50ZXJ2YWwnLCAtPlxuICAgIGRlc2NyaWJlICd3aGVuIFwiYXV0by11cGRhdGUtcGFja2FnZXMuaW50ZXJ2YWxNaW51dGVzXCIgaXMgMzYwJywgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgYXRvbS5jb25maWcuc2V0KCdhdXRvLXVwZGF0ZS1wYWNrYWdlcy5pbnRlcnZhbE1pbnV0ZXMnLCAzNjApXG5cbiAgICAgIGl0ICdyZXR1cm5zIDE0NDAwMDAgKDI0IG1pbnV0ZXMpJywgLT5cbiAgICAgICAgZXhwZWN0KEF1dG9VcGRhdGVQYWNrYWdlcy5nZXRBdXRvVXBkYXRlQ2hlY2tJbnRlcnZhbCgpKS50b0JlKDE0NDAwMDApXG5cbiAgICBkZXNjcmliZSAnd2hlbiBcImF1dG8tdXBkYXRlLXBhY2thZ2VzLmludGVydmFsTWludXRlc1wiIGlzIDMwJywgLT5cbiAgICAgIGJlZm9yZUVhY2ggLT5cbiAgICAgICAgYXRvbS5jb25maWcuc2V0KCdhdXRvLXVwZGF0ZS1wYWNrYWdlcy5pbnRlcnZhbE1pbnV0ZXMnLCAzMClcblxuICAgICAgaXQgJ3JldHVybnMgMTIwMDAwICgyIG1pbnV0ZXMpJywgLT5cbiAgICAgICAgZXhwZWN0KEF1dG9VcGRhdGVQYWNrYWdlcy5nZXRBdXRvVXBkYXRlQ2hlY2tJbnRlcnZhbCgpKS50b0JlKDEyMDAwMClcbiJdfQ==
