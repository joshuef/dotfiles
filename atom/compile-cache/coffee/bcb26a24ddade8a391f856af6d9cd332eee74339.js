(function() {
  var grammarTest, path;

  path = require('path');

  grammarTest = require('atom-grammar-test');

  describe('Grammar', function() {
    beforeEach(function() {
      waitsForPromise(function() {
        return atom.packages.activatePackage('language-babel');
      });
      waitsForPromise(function() {
        return atom.packages.activatePackage('language-todo');
      });
      waitsForPromise(function() {
        return atom.packages.activatePackage('language-hyperlink');
      });
      waitsForPromise(function() {
        return atom.packages.activatePackage('language-mustache');
      });
      return waitsForPromise(function() {
        return atom.packages.activatePackage('language-html');
      });
    });
    grammarTest(path.join(__dirname, 'fixtures/grammar/private-fields.js'));
    grammarTest(path.join(__dirname, 'fixtures/grammar/babel-sublime/flow.js'));
    grammarTest(path.join(__dirname, 'fixtures/grammar/babel-sublime/js-class.js'));
    grammarTest(path.join(__dirname, 'fixtures/grammar/babel-sublime/js-functions.js'));
    grammarTest(path.join(__dirname, 'fixtures/grammar/babel-sublime/js-symbols.js'));
    grammarTest(path.join(__dirname, 'fixtures/grammar/babel-sublime/js-template-strings.js'));
    grammarTest(path.join(__dirname, 'fixtures/grammar/babel-sublime/jsx-attributes.jsx'));
    grammarTest(path.join(__dirname, 'fixtures/grammar/babel-sublime/jsx-es6.jsx'));
    grammarTest(path.join(__dirname, 'fixtures/grammar/babel-sublime/jsx-features.jsx'));
    grammarTest(path.join(__dirname, 'fixtures/grammar/babel-sublime/jsx-full-react-class.jsx'));
    grammarTest(path.join(__dirname, 'fixtures/grammar/babel-sublime/jsx-text.jsx'));
    grammarTest(path.join(__dirname, 'fixtures/grammar/declare.js'));
    grammarTest(path.join(__dirname, 'fixtures/grammar/large files/browser-polyfill.js'));
    grammarTest(path.join(__dirname, 'fixtures/grammar/large files/jquery-2.1.4.js'));
    grammarTest(path.join(__dirname, 'fixtures/grammar/large files/bundle.js'));
    grammarTest(path.join(__dirname, 'fixtures/grammar/large files/jquery-2.1.4.min.js'));
    grammarTest(path.join(__dirname, 'fixtures/grammar/everythingJs/es2015-module.js'));
    grammarTest(path.join(__dirname, 'fixtures/grammar/doc-keywords.js'));
    grammarTest(path.join(__dirname, 'fixtures/grammar/flow-predicates.js'));
    grammarTest(path.join(__dirname, 'fixtures/grammar/issues.js'));
    grammarTest(path.join(__dirname, 'fixtures/grammar/misc.js'));
    grammarTest(path.join(__dirname, 'fixtures/grammar/es6module.js'));
    return grammarTest(path.join(__dirname, 'fixtures/grammar/graphql.js'));
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvLmF0b20vcGFja2FnZXMvbGFuZ3VhZ2UtYmFiZWwvc3BlYy9ncmFtbWFyLXNwZWMuY29mZmVlIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQUEsTUFBQTs7RUFBQSxJQUFBLEdBQU8sT0FBQSxDQUFRLE1BQVI7O0VBQ1AsV0FBQSxHQUFjLE9BQUEsQ0FBUSxtQkFBUjs7RUFFZCxRQUFBLENBQVMsU0FBVCxFQUFvQixTQUFBO0lBQ2xCLFVBQUEsQ0FBVyxTQUFBO01BQ1QsZUFBQSxDQUFnQixTQUFBO2VBQ2QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFkLENBQThCLGdCQUE5QjtNQURjLENBQWhCO01BRUEsZUFBQSxDQUFnQixTQUFBO2VBQ2QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFkLENBQThCLGVBQTlCO01BRGMsQ0FBaEI7TUFFQSxlQUFBLENBQWdCLFNBQUE7ZUFDZCxJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWQsQ0FBOEIsb0JBQTlCO01BRGMsQ0FBaEI7TUFFQSxlQUFBLENBQWdCLFNBQUE7ZUFDZCxJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWQsQ0FBOEIsbUJBQTlCO01BRGMsQ0FBaEI7YUFFQSxlQUFBLENBQWdCLFNBQUE7ZUFDZCxJQUFJLENBQUMsUUFBUSxDQUFDLGVBQWQsQ0FBOEIsZUFBOUI7TUFEYyxDQUFoQjtJQVRTLENBQVg7SUFhQSxXQUFBLENBQVksSUFBSSxDQUFDLElBQUwsQ0FBVSxTQUFWLEVBQXFCLG9DQUFyQixDQUFaO0lBR0EsV0FBQSxDQUFZLElBQUksQ0FBQyxJQUFMLENBQVUsU0FBVixFQUFxQix3Q0FBckIsQ0FBWjtJQUNBLFdBQUEsQ0FBWSxJQUFJLENBQUMsSUFBTCxDQUFVLFNBQVYsRUFBcUIsNENBQXJCLENBQVo7SUFDQSxXQUFBLENBQVksSUFBSSxDQUFDLElBQUwsQ0FBVSxTQUFWLEVBQXFCLGdEQUFyQixDQUFaO0lBQ0EsV0FBQSxDQUFZLElBQUksQ0FBQyxJQUFMLENBQVUsU0FBVixFQUFxQiw4Q0FBckIsQ0FBWjtJQUNBLFdBQUEsQ0FBWSxJQUFJLENBQUMsSUFBTCxDQUFVLFNBQVYsRUFBcUIsdURBQXJCLENBQVo7SUFDQSxXQUFBLENBQVksSUFBSSxDQUFDLElBQUwsQ0FBVSxTQUFWLEVBQXFCLG1EQUFyQixDQUFaO0lBQ0EsV0FBQSxDQUFZLElBQUksQ0FBQyxJQUFMLENBQVUsU0FBVixFQUFxQiw0Q0FBckIsQ0FBWjtJQUNBLFdBQUEsQ0FBWSxJQUFJLENBQUMsSUFBTCxDQUFVLFNBQVYsRUFBcUIsaURBQXJCLENBQVo7SUFDQSxXQUFBLENBQVksSUFBSSxDQUFDLElBQUwsQ0FBVSxTQUFWLEVBQXFCLHlEQUFyQixDQUFaO0lBQ0EsV0FBQSxDQUFZLElBQUksQ0FBQyxJQUFMLENBQVUsU0FBVixFQUFxQiw2Q0FBckIsQ0FBWjtJQUdBLFdBQUEsQ0FBWSxJQUFJLENBQUMsSUFBTCxDQUFVLFNBQVYsRUFBcUIsNkJBQXJCLENBQVo7SUFHQSxXQUFBLENBQVksSUFBSSxDQUFDLElBQUwsQ0FBVSxTQUFWLEVBQXFCLGtEQUFyQixDQUFaO0lBQ0EsV0FBQSxDQUFZLElBQUksQ0FBQyxJQUFMLENBQVUsU0FBVixFQUFxQiw4Q0FBckIsQ0FBWjtJQUNBLFdBQUEsQ0FBWSxJQUFJLENBQUMsSUFBTCxDQUFVLFNBQVYsRUFBcUIsd0NBQXJCLENBQVo7SUFDQSxXQUFBLENBQVksSUFBSSxDQUFDLElBQUwsQ0FBVSxTQUFWLEVBQXFCLGtEQUFyQixDQUFaO0lBR0EsV0FBQSxDQUFZLElBQUksQ0FBQyxJQUFMLENBQVUsU0FBVixFQUFxQixnREFBckIsQ0FBWjtJQUdBLFdBQUEsQ0FBWSxJQUFJLENBQUMsSUFBTCxDQUFVLFNBQVYsRUFBcUIsa0NBQXJCLENBQVo7SUFHQSxXQUFBLENBQVksSUFBSSxDQUFDLElBQUwsQ0FBVSxTQUFWLEVBQXFCLHFDQUFyQixDQUFaO0lBR0EsV0FBQSxDQUFZLElBQUksQ0FBQyxJQUFMLENBQVUsU0FBVixFQUFxQiw0QkFBckIsQ0FBWjtJQUdBLFdBQUEsQ0FBWSxJQUFJLENBQUMsSUFBTCxDQUFVLFNBQVYsRUFBcUIsMEJBQXJCLENBQVo7SUFDQSxXQUFBLENBQVksSUFBSSxDQUFDLElBQUwsQ0FBVSxTQUFWLEVBQXFCLCtCQUFyQixDQUFaO1dBR0EsV0FBQSxDQUFZLElBQUksQ0FBQyxJQUFMLENBQVUsU0FBVixFQUFxQiw2QkFBckIsQ0FBWjtFQXREa0IsQ0FBcEI7QUFIQSIsInNvdXJjZXNDb250ZW50IjpbInBhdGggPSByZXF1aXJlICdwYXRoJ1xuZ3JhbW1hclRlc3QgPSByZXF1aXJlICdhdG9tLWdyYW1tYXItdGVzdCdcblxuZGVzY3JpYmUgJ0dyYW1tYXInLCAtPlxuICBiZWZvcmVFYWNoIC0+XG4gICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICBhdG9tLnBhY2thZ2VzLmFjdGl2YXRlUGFja2FnZSgnbGFuZ3VhZ2UtYmFiZWwnKVxuICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgYXRvbS5wYWNrYWdlcy5hY3RpdmF0ZVBhY2thZ2UoJ2xhbmd1YWdlLXRvZG8nKVxuICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgYXRvbS5wYWNrYWdlcy5hY3RpdmF0ZVBhY2thZ2UoJ2xhbmd1YWdlLWh5cGVybGluaycpXG4gICAgd2FpdHNGb3JQcm9taXNlIC0+XG4gICAgICBhdG9tLnBhY2thZ2VzLmFjdGl2YXRlUGFja2FnZSgnbGFuZ3VhZ2UtbXVzdGFjaGUnKVxuICAgIHdhaXRzRm9yUHJvbWlzZSAtPlxuICAgICAgYXRvbS5wYWNrYWdlcy5hY3RpdmF0ZVBhY2thZ2UoJ2xhbmd1YWdlLWh0bWwnKVxuXG4gICMgdGVzdCBwcml2YXRlIGNsYXNzIGZpZWxkcyBhbmQgbWV0aG9kc1xuICBncmFtbWFyVGVzdCBwYXRoLmpvaW4oX19kaXJuYW1lLCAnZml4dHVyZXMvZ3JhbW1hci9wcml2YXRlLWZpZWxkcy5qcycpXG5cbiAgIyBiYWJlbC1zdWJsaW1lIHRlc3QgZmlsZXNcbiAgZ3JhbW1hclRlc3QgcGF0aC5qb2luKF9fZGlybmFtZSwgJ2ZpeHR1cmVzL2dyYW1tYXIvYmFiZWwtc3VibGltZS9mbG93LmpzJylcbiAgZ3JhbW1hclRlc3QgcGF0aC5qb2luKF9fZGlybmFtZSwgJ2ZpeHR1cmVzL2dyYW1tYXIvYmFiZWwtc3VibGltZS9qcy1jbGFzcy5qcycpXG4gIGdyYW1tYXJUZXN0IHBhdGguam9pbihfX2Rpcm5hbWUsICdmaXh0dXJlcy9ncmFtbWFyL2JhYmVsLXN1YmxpbWUvanMtZnVuY3Rpb25zLmpzJylcbiAgZ3JhbW1hclRlc3QgcGF0aC5qb2luKF9fZGlybmFtZSwgJ2ZpeHR1cmVzL2dyYW1tYXIvYmFiZWwtc3VibGltZS9qcy1zeW1ib2xzLmpzJylcbiAgZ3JhbW1hclRlc3QgcGF0aC5qb2luKF9fZGlybmFtZSwgJ2ZpeHR1cmVzL2dyYW1tYXIvYmFiZWwtc3VibGltZS9qcy10ZW1wbGF0ZS1zdHJpbmdzLmpzJylcbiAgZ3JhbW1hclRlc3QgcGF0aC5qb2luKF9fZGlybmFtZSwgJ2ZpeHR1cmVzL2dyYW1tYXIvYmFiZWwtc3VibGltZS9qc3gtYXR0cmlidXRlcy5qc3gnKVxuICBncmFtbWFyVGVzdCBwYXRoLmpvaW4oX19kaXJuYW1lLCAnZml4dHVyZXMvZ3JhbW1hci9iYWJlbC1zdWJsaW1lL2pzeC1lczYuanN4JylcbiAgZ3JhbW1hclRlc3QgcGF0aC5qb2luKF9fZGlybmFtZSwgJ2ZpeHR1cmVzL2dyYW1tYXIvYmFiZWwtc3VibGltZS9qc3gtZmVhdHVyZXMuanN4JylcbiAgZ3JhbW1hclRlc3QgcGF0aC5qb2luKF9fZGlybmFtZSwgJ2ZpeHR1cmVzL2dyYW1tYXIvYmFiZWwtc3VibGltZS9qc3gtZnVsbC1yZWFjdC1jbGFzcy5qc3gnKVxuICBncmFtbWFyVGVzdCBwYXRoLmpvaW4oX19kaXJuYW1lLCAnZml4dHVyZXMvZ3JhbW1hci9iYWJlbC1zdWJsaW1lL2pzeC10ZXh0LmpzeCcpXG5cbiAgIyBmbG93IGRlY2xhcmF0aW9uIGZpbGVcbiAgZ3JhbW1hclRlc3QgcGF0aC5qb2luKF9fZGlybmFtZSwgJ2ZpeHR1cmVzL2dyYW1tYXIvZGVjbGFyZS5qcycpXG5cbiAgIyBncmFtbWFyIHRlc3QgbGFyZ2UgZmlsZXNcbiAgZ3JhbW1hclRlc3QgcGF0aC5qb2luKF9fZGlybmFtZSwgJ2ZpeHR1cmVzL2dyYW1tYXIvbGFyZ2UgZmlsZXMvYnJvd3Nlci1wb2x5ZmlsbC5qcycpXG4gIGdyYW1tYXJUZXN0IHBhdGguam9pbihfX2Rpcm5hbWUsICdmaXh0dXJlcy9ncmFtbWFyL2xhcmdlIGZpbGVzL2pxdWVyeS0yLjEuNC5qcycpXG4gIGdyYW1tYXJUZXN0IHBhdGguam9pbihfX2Rpcm5hbWUsICdmaXh0dXJlcy9ncmFtbWFyL2xhcmdlIGZpbGVzL2J1bmRsZS5qcycpXG4gIGdyYW1tYXJUZXN0IHBhdGguam9pbihfX2Rpcm5hbWUsICdmaXh0dXJlcy9ncmFtbWFyL2xhcmdlIGZpbGVzL2pxdWVyeS0yLjEuNC5taW4uanMnKVxuXG4gICMgIyBlczIwMTUgY2hlY2tcbiAgZ3JhbW1hclRlc3QgcGF0aC5qb2luKF9fZGlybmFtZSwgJ2ZpeHR1cmVzL2dyYW1tYXIvZXZlcnl0aGluZ0pzL2VzMjAxNS1tb2R1bGUuanMnKVxuXG4gICMgdG9kbyxqc2RvYywuLi5cbiAgZ3JhbW1hclRlc3QgcGF0aC5qb2luKF9fZGlybmFtZSwgJ2ZpeHR1cmVzL2dyYW1tYXIvZG9jLWtleXdvcmRzLmpzJylcblxuICAjIGZsb3cgcHJlZGljYXRlcy4uLlxuICBncmFtbWFyVGVzdCBwYXRoLmpvaW4oX19kaXJuYW1lLCAnZml4dHVyZXMvZ3JhbW1hci9mbG93LXByZWRpY2F0ZXMuanMnKVxuXG4gICMgaXNzdWVzIHJhaXNlZFxuICBncmFtbWFyVGVzdCBwYXRoLmpvaW4oX19kaXJuYW1lLCAnZml4dHVyZXMvZ3JhbW1hci9pc3N1ZXMuanMnKVxuXG4gICMgbWlzYyBUZXN0c1xuICBncmFtbWFyVGVzdCBwYXRoLmpvaW4oX19kaXJuYW1lLCAnZml4dHVyZXMvZ3JhbW1hci9taXNjLmpzJylcbiAgZ3JhbW1hclRlc3QgcGF0aC5qb2luKF9fZGlybmFtZSwgJ2ZpeHR1cmVzL2dyYW1tYXIvZXM2bW9kdWxlLmpzJylcblxuICAjIGdyYXBocWwgdGVzdFxuICBncmFtbWFyVGVzdCBwYXRoLmpvaW4oX19kaXJuYW1lLCAnZml4dHVyZXMvZ3JhbW1hci9ncmFwaHFsLmpzJylcbiJdfQ==