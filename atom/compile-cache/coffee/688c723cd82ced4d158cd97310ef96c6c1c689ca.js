(function() {
  var CompositeDisposable, EventsDelegation, StickyTitle;

  EventsDelegation = require('atom-utils').EventsDelegation;

  CompositeDisposable = null;

  module.exports = StickyTitle = (function() {
    EventsDelegation.includeInto(StickyTitle);

    function StickyTitle(stickies, scrollContainer) {
      this.stickies = stickies;
      this.scrollContainer = scrollContainer;
      if (CompositeDisposable == null) {
        CompositeDisposable = require('atom').CompositeDisposable;
      }
      this.subscriptions = new CompositeDisposable;
      Array.prototype.forEach.call(this.stickies, function(sticky) {
        sticky.parentNode.style.height = sticky.offsetHeight + 'px';
        return sticky.style.width = sticky.offsetWidth + 'px';
      });
      this.subscriptions.add(this.subscribeTo(this.scrollContainer, {
        'scroll': (function(_this) {
          return function(e) {
            return _this.scroll(e);
          };
        })(this)
      }));
    }

    StickyTitle.prototype.dispose = function() {
      this.subscriptions.dispose();
      this.stickies = null;
      return this.scrollContainer = null;
    };

    StickyTitle.prototype.scroll = function(e) {
      var delta;
      delta = this.lastScrollTop ? this.lastScrollTop - this.scrollContainer.scrollTop : 0;
      Array.prototype.forEach.call(this.stickies, (function(_this) {
        return function(sticky, i) {
          var nextSticky, nextTop, parentTop, prevSticky, prevTop, scrollTop, top;
          nextSticky = _this.stickies[i + 1];
          prevSticky = _this.stickies[i - 1];
          scrollTop = _this.scrollContainer.getBoundingClientRect().top;
          parentTop = sticky.parentNode.getBoundingClientRect().top;
          top = sticky.getBoundingClientRect().top;
          if (parentTop < scrollTop) {
            if (!sticky.classList.contains('absolute')) {
              sticky.classList.add('fixed');
              sticky.style.top = scrollTop + 'px';
              if (nextSticky != null) {
                nextTop = nextSticky.parentNode.getBoundingClientRect().top;
                if (top + sticky.offsetHeight >= nextTop) {
                  sticky.classList.add('absolute');
                  return sticky.style.top = _this.scrollContainer.scrollTop + 'px';
                }
              }
            }
          } else {
            sticky.classList.remove('fixed');
            if ((prevSticky != null) && prevSticky.classList.contains('absolute')) {
              prevTop = prevSticky.getBoundingClientRect().top;
              if (delta < 0) {
                prevTop -= prevSticky.offsetHeight;
              }
              if (scrollTop <= prevTop) {
                prevSticky.classList.remove('absolute');
                return prevSticky.style.top = scrollTop + 'px';
              }
            }
          }
        };
      })(this));
      return this.lastScrollTop = this.scrollContainer.scrollTop;
    };

    return StickyTitle;

  })();

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvLmF0b20vcGFja2FnZXMvcGlnbWVudHMvbGliL3N0aWNreS10aXRsZS5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFDLG1CQUFvQixPQUFBLENBQVEsWUFBUjs7RUFDckIsbUJBQUEsR0FBc0I7O0VBRXRCLE1BQU0sQ0FBQyxPQUFQLEdBQ007SUFDSixnQkFBZ0IsQ0FBQyxXQUFqQixDQUE2QixXQUE3Qjs7SUFFYSxxQkFBQyxRQUFELEVBQVksZUFBWjtNQUFDLElBQUMsQ0FBQSxXQUFEO01BQVcsSUFBQyxDQUFBLGtCQUFEOztRQUN2QixzQkFBdUIsT0FBQSxDQUFRLE1BQVIsQ0FBZSxDQUFDOztNQUV2QyxJQUFDLENBQUEsYUFBRCxHQUFpQixJQUFJO01BQ3JCLEtBQUssQ0FBQSxTQUFFLENBQUEsT0FBTyxDQUFDLElBQWYsQ0FBb0IsSUFBQyxDQUFBLFFBQXJCLEVBQStCLFNBQUMsTUFBRDtRQUM3QixNQUFNLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxNQUF4QixHQUFpQyxNQUFNLENBQUMsWUFBUCxHQUFzQjtlQUN2RCxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQWIsR0FBcUIsTUFBTSxDQUFDLFdBQVAsR0FBcUI7TUFGYixDQUEvQjtNQUlBLElBQUMsQ0FBQSxhQUFhLENBQUMsR0FBZixDQUFtQixJQUFDLENBQUEsV0FBRCxDQUFhLElBQUMsQ0FBQSxlQUFkLEVBQStCO1FBQUEsUUFBQSxFQUFVLENBQUEsU0FBQSxLQUFBO2lCQUFBLFNBQUMsQ0FBRDttQkFDMUQsS0FBQyxDQUFBLE1BQUQsQ0FBUSxDQUFSO1VBRDBEO1FBQUEsQ0FBQSxDQUFBLENBQUEsSUFBQSxDQUFWO09BQS9CLENBQW5CO0lBUlc7OzBCQVdiLE9BQUEsR0FBUyxTQUFBO01BQ1AsSUFBQyxDQUFBLGFBQWEsQ0FBQyxPQUFmLENBQUE7TUFDQSxJQUFDLENBQUEsUUFBRCxHQUFZO2FBQ1osSUFBQyxDQUFBLGVBQUQsR0FBbUI7SUFIWjs7MEJBS1QsTUFBQSxHQUFRLFNBQUMsQ0FBRDtBQUNOLFVBQUE7TUFBQSxLQUFBLEdBQVcsSUFBQyxDQUFBLGFBQUosR0FDTixJQUFDLENBQUEsYUFBRCxHQUFpQixJQUFDLENBQUEsZUFBZSxDQUFDLFNBRDVCLEdBR047TUFFRixLQUFLLENBQUEsU0FBRSxDQUFBLE9BQU8sQ0FBQyxJQUFmLENBQW9CLElBQUMsQ0FBQSxRQUFyQixFQUErQixDQUFBLFNBQUEsS0FBQTtlQUFBLFNBQUMsTUFBRCxFQUFTLENBQVQ7QUFDN0IsY0FBQTtVQUFBLFVBQUEsR0FBYSxLQUFDLENBQUEsUUFBUyxDQUFBLENBQUEsR0FBSSxDQUFKO1VBQ3ZCLFVBQUEsR0FBYSxLQUFDLENBQUEsUUFBUyxDQUFBLENBQUEsR0FBSSxDQUFKO1VBQ3ZCLFNBQUEsR0FBWSxLQUFDLENBQUEsZUFBZSxDQUFDLHFCQUFqQixDQUFBLENBQXdDLENBQUM7VUFDckQsU0FBQSxHQUFZLE1BQU0sQ0FBQyxVQUFVLENBQUMscUJBQWxCLENBQUEsQ0FBeUMsQ0FBQztVQUNyRCxNQUFPLE1BQU0sQ0FBQyxxQkFBUCxDQUFBO1VBRVIsSUFBRyxTQUFBLEdBQVksU0FBZjtZQUNFLElBQUEsQ0FBTyxNQUFNLENBQUMsU0FBUyxDQUFDLFFBQWpCLENBQTBCLFVBQTFCLENBQVA7Y0FDRSxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQWpCLENBQXFCLE9BQXJCO2NBQ0EsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFiLEdBQW1CLFNBQUEsR0FBWTtjQUUvQixJQUFHLGtCQUFIO2dCQUNFLE9BQUEsR0FBVSxVQUFVLENBQUMsVUFBVSxDQUFDLHFCQUF0QixDQUFBLENBQTZDLENBQUM7Z0JBQ3hELElBQUcsR0FBQSxHQUFNLE1BQU0sQ0FBQyxZQUFiLElBQTZCLE9BQWhDO2tCQUNFLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBakIsQ0FBcUIsVUFBckI7eUJBQ0EsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFiLEdBQW1CLEtBQUMsQ0FBQSxlQUFlLENBQUMsU0FBakIsR0FBNkIsS0FGbEQ7aUJBRkY7ZUFKRjthQURGO1dBQUEsTUFBQTtZQVlFLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBakIsQ0FBd0IsT0FBeEI7WUFFQSxJQUFHLG9CQUFBLElBQWdCLFVBQVUsQ0FBQyxTQUFTLENBQUMsUUFBckIsQ0FBOEIsVUFBOUIsQ0FBbkI7Y0FDRSxPQUFBLEdBQVUsVUFBVSxDQUFDLHFCQUFYLENBQUEsQ0FBa0MsQ0FBQztjQUM3QyxJQUFzQyxLQUFBLEdBQVEsQ0FBOUM7Z0JBQUEsT0FBQSxJQUFXLFVBQVUsQ0FBQyxhQUF0Qjs7Y0FFQSxJQUFHLFNBQUEsSUFBYSxPQUFoQjtnQkFDRSxVQUFVLENBQUMsU0FBUyxDQUFDLE1BQXJCLENBQTRCLFVBQTVCO3VCQUNBLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBakIsR0FBdUIsU0FBQSxHQUFZLEtBRnJDO2VBSkY7YUFkRjs7UUFQNkI7TUFBQSxDQUFBLENBQUEsQ0FBQSxJQUFBLENBQS9CO2FBNkJBLElBQUMsQ0FBQSxhQUFELEdBQWlCLElBQUMsQ0FBQSxlQUFlLENBQUM7SUFuQzVCOzs7OztBQXZCViIsInNvdXJjZXNDb250ZW50IjpbIntFdmVudHNEZWxlZ2F0aW9ufSA9IHJlcXVpcmUgJ2F0b20tdXRpbHMnXG5Db21wb3NpdGVEaXNwb3NhYmxlID0gbnVsbFxuXG5tb2R1bGUuZXhwb3J0cyA9XG5jbGFzcyBTdGlja3lUaXRsZVxuICBFdmVudHNEZWxlZ2F0aW9uLmluY2x1ZGVJbnRvKHRoaXMpXG5cbiAgY29uc3RydWN0b3I6IChAc3RpY2tpZXMsIEBzY3JvbGxDb250YWluZXIpIC0+XG4gICAgQ29tcG9zaXRlRGlzcG9zYWJsZSA/PSByZXF1aXJlKCdhdG9tJykuQ29tcG9zaXRlRGlzcG9zYWJsZVxuXG4gICAgQHN1YnNjcmlwdGlvbnMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZVxuICAgIEFycmF5Ojpmb3JFYWNoLmNhbGwgQHN0aWNraWVzLCAoc3RpY2t5KSAtPlxuICAgICAgc3RpY2t5LnBhcmVudE5vZGUuc3R5bGUuaGVpZ2h0ID0gc3RpY2t5Lm9mZnNldEhlaWdodCArICdweCdcbiAgICAgIHN0aWNreS5zdHlsZS53aWR0aCA9IHN0aWNreS5vZmZzZXRXaWR0aCArICdweCdcblxuICAgIEBzdWJzY3JpcHRpb25zLmFkZCBAc3Vic2NyaWJlVG8gQHNjcm9sbENvbnRhaW5lciwgJ3Njcm9sbCc6IChlKSA9PlxuICAgICAgQHNjcm9sbChlKVxuXG4gIGRpc3Bvc2U6IC0+XG4gICAgQHN1YnNjcmlwdGlvbnMuZGlzcG9zZSgpXG4gICAgQHN0aWNraWVzID0gbnVsbFxuICAgIEBzY3JvbGxDb250YWluZXIgPSBudWxsXG5cbiAgc2Nyb2xsOiAoZSkgLT5cbiAgICBkZWx0YSA9IGlmIEBsYXN0U2Nyb2xsVG9wXG4gICAgICBAbGFzdFNjcm9sbFRvcCAtIEBzY3JvbGxDb250YWluZXIuc2Nyb2xsVG9wXG4gICAgZWxzZVxuICAgICAgMFxuXG4gICAgQXJyYXk6OmZvckVhY2guY2FsbCBAc3RpY2tpZXMsIChzdGlja3ksIGkpID0+XG4gICAgICBuZXh0U3RpY2t5ID0gQHN0aWNraWVzW2kgKyAxXVxuICAgICAgcHJldlN0aWNreSA9IEBzdGlja2llc1tpIC0gMV1cbiAgICAgIHNjcm9sbFRvcCA9IEBzY3JvbGxDb250YWluZXIuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wXG4gICAgICBwYXJlbnRUb3AgPSBzdGlja3kucGFyZW50Tm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3BcbiAgICAgIHt0b3B9ID0gc3RpY2t5LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpXG5cbiAgICAgIGlmIHBhcmVudFRvcCA8IHNjcm9sbFRvcFxuICAgICAgICB1bmxlc3Mgc3RpY2t5LmNsYXNzTGlzdC5jb250YWlucygnYWJzb2x1dGUnKVxuICAgICAgICAgIHN0aWNreS5jbGFzc0xpc3QuYWRkICdmaXhlZCdcbiAgICAgICAgICBzdGlja3kuc3R5bGUudG9wID0gc2Nyb2xsVG9wICsgJ3B4J1xuXG4gICAgICAgICAgaWYgbmV4dFN0aWNreT9cbiAgICAgICAgICAgIG5leHRUb3AgPSBuZXh0U3RpY2t5LnBhcmVudE5vZGUuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkudG9wXG4gICAgICAgICAgICBpZiB0b3AgKyBzdGlja3kub2Zmc2V0SGVpZ2h0ID49IG5leHRUb3BcbiAgICAgICAgICAgICAgc3RpY2t5LmNsYXNzTGlzdC5hZGQoJ2Fic29sdXRlJylcbiAgICAgICAgICAgICAgc3RpY2t5LnN0eWxlLnRvcCA9IEBzY3JvbGxDb250YWluZXIuc2Nyb2xsVG9wICsgJ3B4J1xuXG4gICAgICBlbHNlXG4gICAgICAgIHN0aWNreS5jbGFzc0xpc3QucmVtb3ZlICdmaXhlZCdcblxuICAgICAgICBpZiBwcmV2U3RpY2t5PyBhbmQgcHJldlN0aWNreS5jbGFzc0xpc3QuY29udGFpbnMoJ2Fic29sdXRlJylcbiAgICAgICAgICBwcmV2VG9wID0gcHJldlN0aWNreS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS50b3BcbiAgICAgICAgICBwcmV2VG9wIC09IHByZXZTdGlja3kub2Zmc2V0SGVpZ2h0IGlmIGRlbHRhIDwgMFxuXG4gICAgICAgICAgaWYgc2Nyb2xsVG9wIDw9IHByZXZUb3BcbiAgICAgICAgICAgIHByZXZTdGlja3kuY2xhc3NMaXN0LnJlbW92ZSgnYWJzb2x1dGUnKVxuICAgICAgICAgICAgcHJldlN0aWNreS5zdHlsZS50b3AgPSBzY3JvbGxUb3AgKyAncHgnXG5cbiAgICBAbGFzdFNjcm9sbFRvcCA9IEBzY3JvbGxDb250YWluZXIuc2Nyb2xsVG9wXG4iXX0=
