(function() {
  var ExpressionsRegistry;

  ExpressionsRegistry = require('../lib/expressions-registry');

  describe('ExpressionsRegistry', function() {
    var Dummy, ref, registry;
    ref = [], registry = ref[0], Dummy = ref[1];
    beforeEach(function() {
      Dummy = (function() {
        function Dummy(arg) {
          this.name = arg.name, this.regexpString = arg.regexpString, this.priority = arg.priority, this.scopes = arg.scopes, this.handle = arg.handle;
        }

        return Dummy;

      })();
      return registry = new ExpressionsRegistry(Dummy);
    });
    describe('::createExpression', function() {
      return describe('called with enough data', function() {
        return it('creates a new expression of this registry expressions type', function() {
          var expression;
          expression = registry.createExpression('dummy', 'foo');
          expect(expression.constructor).toBe(Dummy);
          return expect(registry.getExpressions()).toEqual([expression]);
        });
      });
    });
    describe('::addExpression', function() {
      return it('adds a previously created expression in the registry', function() {
        var expression;
        expression = new Dummy({
          name: 'bar'
        });
        registry.addExpression(expression);
        expect(registry.getExpression('bar')).toBe(expression);
        return expect(registry.getExpressions()).toEqual([expression]);
      });
    });
    describe('::getExpressions', function() {
      return it('returns the expression based on their priority', function() {
        var expression1, expression2, expression3;
        expression1 = registry.createExpression('dummy1', '', 2);
        expression2 = registry.createExpression('dummy2', '', 0);
        expression3 = registry.createExpression('dummy3', '', 1);
        return expect(registry.getExpressions()).toEqual([expression1, expression3, expression2]);
      });
    });
    describe('::removeExpression', function() {
      return it('removes an expression with its name', function() {
        registry.createExpression('dummy', 'foo');
        registry.removeExpression('dummy');
        return expect(registry.getExpressions()).toEqual([]);
      });
    });
    describe('::serialize', function() {
      return it('serializes the registry with the function content', function() {
        var serialized;
        registry.createExpression('dummy', 'foo');
        registry.createExpression('dummy2', 'bar', function(a, b, c) {
          return a + b - c;
        });
        serialized = registry.serialize();
        expect(serialized.regexpString).toEqual('(foo)|(bar)');
        expect(serialized.expressions.dummy).toEqual({
          name: 'dummy',
          regexpString: 'foo',
          handle: void 0,
          priority: 0,
          scopes: ['*']
        });
        return expect(serialized.expressions.dummy2).toEqual({
          name: 'dummy2',
          regexpString: 'bar',
          handle: registry.getExpression('dummy2').handle.toString(),
          priority: 0,
          scopes: ['*']
        });
      });
    });
    return describe('.deserialize', function() {
      return it('deserializes the provided expressions using the specified model', function() {
        var deserialized, serialized;
        serialized = {
          regexpString: 'foo|bar',
          expressions: {
            dummy: {
              name: 'dummy',
              regexpString: 'foo',
              handle: 'function (a,b,c) { return a + b - c; }',
              priority: 0,
              scopes: ['*']
            }
          }
        };
        deserialized = ExpressionsRegistry.deserialize(serialized, Dummy);
        expect(deserialized.getRegExp()).toEqual('foo|bar');
        expect(deserialized.getExpression('dummy').name).toEqual('dummy');
        expect(deserialized.getExpression('dummy').regexpString).toEqual('foo');
        return expect(deserialized.getExpression('dummy').handle(1, 2, 3)).toEqual(0);
      });
    });
  });

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvLmF0b20vcGFja2FnZXMvcGlnbWVudHMvc3BlYy9leHByZXNzaW9ucy1yZWdpc3RyeS1zcGVjLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsbUJBQUEsR0FBc0IsT0FBQSxDQUFRLDZCQUFSOztFQUV0QixRQUFBLENBQVMscUJBQVQsRUFBZ0MsU0FBQTtBQUM5QixRQUFBO0lBQUEsTUFBb0IsRUFBcEIsRUFBQyxpQkFBRCxFQUFXO0lBRVgsVUFBQSxDQUFXLFNBQUE7TUFDSDtRQUNTLGVBQUMsR0FBRDtVQUFFLElBQUMsQ0FBQSxXQUFBLE1BQU0sSUFBQyxDQUFBLG1CQUFBLGNBQWMsSUFBQyxDQUFBLGVBQUEsVUFBVSxJQUFDLENBQUEsYUFBQSxRQUFRLElBQUMsQ0FBQSxhQUFBO1FBQTdDOzs7OzthQUVmLFFBQUEsR0FBZSxJQUFBLG1CQUFBLENBQW9CLEtBQXBCO0lBSk4sQ0FBWDtJQU1BLFFBQUEsQ0FBUyxvQkFBVCxFQUErQixTQUFBO2FBQzdCLFFBQUEsQ0FBUyx5QkFBVCxFQUFvQyxTQUFBO2VBQ2xDLEVBQUEsQ0FBRyw0REFBSCxFQUFpRSxTQUFBO0FBQy9ELGNBQUE7VUFBQSxVQUFBLEdBQWEsUUFBUSxDQUFDLGdCQUFULENBQTBCLE9BQTFCLEVBQW1DLEtBQW5DO1VBRWIsTUFBQSxDQUFPLFVBQVUsQ0FBQyxXQUFsQixDQUE4QixDQUFDLElBQS9CLENBQW9DLEtBQXBDO2lCQUNBLE1BQUEsQ0FBTyxRQUFRLENBQUMsY0FBVCxDQUFBLENBQVAsQ0FBaUMsQ0FBQyxPQUFsQyxDQUEwQyxDQUFDLFVBQUQsQ0FBMUM7UUFKK0QsQ0FBakU7TUFEa0MsQ0FBcEM7SUFENkIsQ0FBL0I7SUFRQSxRQUFBLENBQVMsaUJBQVQsRUFBNEIsU0FBQTthQUMxQixFQUFBLENBQUcsc0RBQUgsRUFBMkQsU0FBQTtBQUN6RCxZQUFBO1FBQUEsVUFB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LEVBQWMsU0FBZDtVQUNBLFdBQUEsRUFDRTtZQUFBLEtBQUEsRUFDRTtjQUFBLElBQUEsRUFBTSxPQUFOO2NBQ0EsWUFBQSxFQUFjLEtBRGQ7Y0FFQSxNQUFBLEVBQVEsd0NBRlI7Y0FHQSxRQUFBLEVBQVUsQ0FIVjtjQUlBLE1BQUEsRUFBUSxDQUFDLEdBQUQsQ0FKUjthQURGO1dBRkY7O1FBU0YsWUFBQSxHQUFlLG1CQUFtQixDQUFDLFdBQXBCLENBQWdDLFVBQWhDLEVBQTRDLEtBQTVDO1FBRWYsTUFBQSxDQUFPLFlBQVksQ0FBQyxTQUFiLENBQUEsQ0FBUCxDQUFnQyxDQUFDLE9BQWpDLENBQXlDLFNBQXpDO1FBQ0EsTUFBQSxDQUFPLFlBQVksQ0FBQyxhQUFiLENBQTJCLE9BQTNCLENBQW1DLENBQUMsSUFBM0MsQ0FBZ0QsQ0FBQyxPQUFqRCxDQUF5RCxPQUF6RDtRQUNBLE1BQUEsQ0FBTyxZQUFZLENBQUMsYUFBYixDQUEyQixPQUEzQixDQUFtQyxDQUFDLFlBQTNDLENBQXdELENBQUMsT0FBekQsQ0FBaUUsS0FBakU7ZUFDQSxNQUFBLENBQU8sWUFBWSxDQUFDLGFBQWIsQ0FBMkIsT0FBM0IsQ0FBbUMsQ0FBQyxNQUFwQyxDQUEyQyxDQUEzQyxFQUE2QyxDQUE3QyxFQUErQyxDQUEvQyxDQUFQLENBQXlELENBQUMsT0FBMUQsQ0FBa0UsQ0FBbEU7TUFoQm9FLENBQXRFO0lBRHVCLENBQXpCO0VBdEU4QixDQUFoQztBQUZBIiwic291cmNlc0NvbnRlbnQiOlsiRXhwcmVzc2lvbnNSZWdpc3RyeSA9IHJlcXVpcmUgJy4uL2xpYi9leHByZXNzaW9ucy1yZWdpc3RyeSdcblxuZGVzY3JpYmUgJ0V4cHJlc3Npb25zUmVnaXN0cnknLCAtPlxuICBbcmVnaXN0cnksIER1bW15XSA9IFtdXG5cbiAgYmVmb3JlRWFjaCAtPlxuICAgIGNsYXNzIER1bW15XG4gICAgICBjb25zdHJ1Y3RvcjogKHtAbmFtZSwgQHJlZ2V4cFN0cmluZywgQHByaW9yaXR5LCBAc2NvcGVzLCBAaGFuZGxlfSkgLT5cblxuICAgIHJlZ2lzdHJ5ID0gbmV3IEV4cHJlc3Npb25zUmVnaXN0cnkoRHVtbXkpXG5cbiAgZGVzY3JpYmUgJzo6Y3JlYXRlRXhwcmVzc2lvbicsIC0+XG4gICAgZGVzY3JpYmUgJ2NhbGxlZCB3aXRoIGVub3VnaCBkYXRhJywgLT5cbiAgICAgIGl0ICdjcmVhdGVzIGEgbmV3IGV4cHJlc3Npb24gb2YgdGhpcyByZWdpc3RyeSBleHByZXNzaW9ucyB0eXBlJywgLT5cbiAgICAgICAgZXhwcmVzc2lvbiA9IHJlZ2lzdHJ5LmNyZWF0ZUV4cHJlc3Npb24gJ2R1bW15JywgJ2ZvbydcblxuICAgICAgICBleHBlY3QoZXhwcmVzc2lvbi5jb25zdHJ1Y3RvcikudG9CZShEdW1teSlcbiAgICAgICAgZXhwZWN0KHJlZ2lzdHJ5LmdldEV4cHJlc3Npb25zKCkpLnRvRXF1YWwoW2V4cHJlc3Npb25dKVxuXG4gIGRlc2NyaWJlICc6OmFkZEV4cHJlc3Npb24nLCAtPlxuICAgIGl0ICdhZGRzIGEgcHJldmlvdXNseSBjcmVhdGVkIGV4cHJlc3Npb24gaW4gdGhlIHJlZ2lzdHJ5JywgLT5cbiAgICAgIGV4cHJlc3Npb24gPSBuZXcgRHVtbXkobmFtZTogJ2JhcicpXG5cbiAgICAgIHJlZ2lzdHJ5LmFkZEV4cHJlc3Npb24oZXhwcmVzc2lvbilcblxuICAgICAgZXhwZWN0KHJlZ2lzdHJ5LmdldEV4cHJlc3Npb24oJ2JhcicpKS50b0JlKGV4cHJlc3Npb24pXG4gICAgICBleHBlY3QocmVnaXN0cnkuZ2V0RXhwcmVzc2lvbnMoKSkudG9FcXVhbChbZXhwcmVzc2lvbl0pXG5cbiAgZGVzY3JpYmUgJzo6Z2V0RXhwcmVzc2lvbnMnLCAtPlxuICAgIGl0ICdyZXR1cm5zIHRoZSBleHByZXNzaW9uIGJhc2VkIG9uIHRoZWlyIHByaW9yaXR5JywgLT5cbiAgICAgIGV4cHJlc3Npb24xID0gcmVnaXN0cnkuY3JlYXRlRXhwcmVzc2lvbiAnZHVtbXkxJywgJycsIDJcbiAgICAgIGV4cHJlc3Npb24yID0gcmVnaXN0cnkuY3JlYXRlRXhwcmVzc2lvbiAnZHVtbXkyJywgJycsIDBcbiAgICAgIGV4cHJlc3Npb24zID0gcmVnaXN0cnkuY3JlYXRlRXhwcmVzc2lvbiAnZHVtbXkzJywgJycsIDFcblxuICAgICAgZXhwZWN0KHJlZ2lzdHJ5LmdldEV4cHJlc3Npb25zKCkpLnRvRXF1YWwoW1xuICAgICAgICBleHByZXNzaW9uMVxuICAgICAgICBleHByZXNzaW9uM1xuICAgICAgICBleHByZXNzaW9uMlxuICAgICAgXSlcblxuICBkZXNjcmliZSAnOjpyZW1vdmVFeHByZXNzaW9uJywgLT5cbiAgICBpdCAncmVtb3ZlcyBhbiBleHByZXNzaW9uIHdpdGggaXRzIG5hbWUnLCAtPlxuICAgICAgcmVnaXN0cnkuY3JlYXRlRXhwcmVzc2lvbiAnZHVtbXknLCAnZm9vJ1xuXG4gICAgICByZWdpc3RyeS5yZW1vdmVFeHByZXNzaW9uKCdkdW1teScpXG5cbiAgICAgIGV4cGVjdChyZWdpc3RyeS5nZXRFeHByZXNzaW9ucygpKS50b0VxdWFsKFtdKVxuXG4gIGRlc2NyaWJlICc6OnNlcmlhbGl6ZScsIC0+XG4gICAgaXQgJ3NlcmlhbGl6ZXMgdGhlIHJlZ2lzdHJ5IHdpdGggdGhlIGZ1bmN0aW9uIGNvbnRlbnQnLCAtPlxuICAgICAgcmVnaXN0cnkuY3JlYXRlRXhwcmVzc2lvbiAnZHVtbXknLCAnZm9vJ1xuICAgICAgcmVnaXN0cnkuY3JlYXRlRXhwcmVzc2lvbiAnZHVtbXkyJywgJ2JhcicsIChhLGIsYykgLT4gYSArIGIgLSBjXG5cbiAgICAgIHNlcmlhbGl6ZWQgPSByZWdpc3RyeS5zZXJpYWxpemUoKVxuXG4gICAgICBleHBlY3Qoc2VyaWFsaXplZC5yZWdleHBTdHJpbmcpLnRvRXF1YWwoJyhmb28pfChiYXIpJylcbiAgICAgIGV4cGVjdChzZXJpYWxpemVkLmV4cHJlc3Npb25zLmR1bW15KS50b0VxdWFsKHtcbiAgICAgICAgbmFtZTogJ2R1bW15J1xuICAgICAgICByZWdleHBTdHJpbmc6ICdmb28nXG4gICAgICAgIGhhbmRsZTogdW5kZWZpbmVkXG4gICAgICAgIHByaW9yaXR5OiAwXG4gICAgICAgIHNjb3BlczogWycqJ11cbiAgICAgIH0pXG5cbiAgICAgIGV4cGVjdChzZXJpYWxpemVkLmV4cHJlc3Npb25zLmR1bW15MikudG9FcXVhbCh7XG4gICAgICAgIG5hbWU6ICdkdW1teTInXG4gICAgICAgIHJlZ2V4cFN0cmluZzogJ2JhcidcbiAgICAgICAgaGFuZGxlOiByZWdpc3RyeS5nZXRFeHByZXNzaW9uKCdkdW1teTInKS5oYW5kbGUudG9TdHJpbmcoKVxuICAgICAgICBwcmlvcml0eTogMFxuICAgICAgICBzY29wZXM6IFsnKiddXG4gICAgICB9KVxuXG4gIGRlc2NyaWJlICcuZGVzZXJpYWxpemUnLCAtPlxuICAgIGl0ICdkZXNlcmlhbGl6ZXMgdGhlIHByb3ZpZGVkIGV4cHJlc3Npb25zIHVzaW5nIHRoZSBzcGVjaWZpZWQgbW9kZWwnLCAtPlxuICAgICAgc2VyaWFsaXplZCA9XG4gICAgICAgIHJlZ2V4cFN0cmluZzogJ2Zvb3xiYXInXG4gICAgICAgIGV4cHJlc3Npb25zOlxuICAgICAgICAgIGR1bW15OlxuICAgICAgICAgICAgbmFtZTogJ2R1bW15J1xuICAgICAgICAgICAgcmVnZXhwU3RyaW5nOiAnZm9vJ1xuICAgICAgICAgICAgaGFuZGxlOiAnZnVuY3Rpb24gKGEsYixjKSB7IHJldHVybiBhICsgYiAtIGM7IH0nXG4gICAgICAgICAgICBwcmlvcml0eTogMFxuICAgICAgICAgICAgc2NvcGVzOiBbJyonXVxuXG4gICAgICBkZXNlcmlhbGl6ZWQgPSBFeHByZXNzaW9uc1JlZ2lzdHJ5LmRlc2VyaWFsaXplKHNlcmlhbGl6ZWQsIER1bW15KVxuXG4gICAgICBleHBlY3QoZGVzZXJpYWxpemVkLmdldFJlZ0V4cCgpKS50b0VxdWFsKCdmb298YmFyJylcbiAgICAgIGV4cGVjdChkZXNlcmlhbGl6ZWQuZ2V0RXhwcmVzc2lvbignZHVtbXknKS5uYW1lKS50b0VxdWFsKCdkdW1teScpXG4gICAgICBleHBlY3QoZGVzZXJpYWxpemVkLmdldEV4cHJlc3Npb24oJ2R1bW15JykucmVnZXhwU3RyaW5nKS50b0VxdWFsKCdmb28nKVxuICAgICAgZXhwZWN0KGRlc2VyaWFsaXplZC5nZXRFeHByZXNzaW9uKCdkdW1teScpLmhhbmRsZSgxLDIsMykpLnRvRXF1YWwoMClcbiJdfQ==
