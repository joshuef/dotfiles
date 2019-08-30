(function() {
  var event, mouseEvent, objectCenterCoordinates;

  event = function(type, properties) {
    if (properties == null) {
      properties = {};
    }
    return new Event(type, properties);
  };

  mouseEvent = function(type, properties) {
    var defaults, k, v;
    defaults = {
      bubbles: true,
      cancelable: type !== "mousemove",
      view: window,
      detail: 0,
      pageX: 0,
      pageY: 0,
      clientX: 0,
      clientY: 0,
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      metaKey: false,
      button: 0,
      relatedTarget: void 0
    };
    for (k in defaults) {
      v = defaults[k];
      if (properties[k] == null) {
        properties[k] = v;
      }
    }
    return new MouseEvent(type, properties);
  };

  objectCenterCoordinates = function(target) {
    var height, left, ref, top, width;
    ref = target.getBoundingClientRect(), top = ref.top, left = ref.left, width = ref.width, height = ref.height;
    return {
      x: left + width / 2,
      y: top + height / 2
    };
  };

  module.exports = {
    objectCenterCoordinates: objectCenterCoordinates,
    mouseEvent: mouseEvent,
    event: event
  };

  ['mousedown', 'mousemove', 'mouseup', 'click'].forEach(function(key) {
    return module.exports[key] = function(target, x, y, cx, cy, btn) {
      var ref;
      if (!((x != null) && (y != null))) {
        ref = objectCenterCoordinates(target), x = ref.x, y = ref.y;
      }
      if (!((cx != null) && (cy != null))) {
        cx = x;
        cy = y;
      }
      return target.dispatchEvent(mouseEvent(key, {
        target: target,
        pageX: x,
        pageY: y,
        clientX: cx,
        clientY: cy,
        button: btn
      }));
    };
  });

  module.exports.mousewheel = function(target, deltaX, deltaY) {
    if (deltaX == null) {
      deltaX = 0;
    }
    if (deltaY == null) {
      deltaY = 0;
    }
    return target.dispatchEvent(mouseEvent('mousewheel', {
      target: target,
      deltaX: deltaX,
      deltaY: deltaY
    }));
  };

  module.exports.change = function(target) {
    return target.dispatchEvent(event('change', {
      target: target
    }));
  };

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2pvc2gvLmF0b20vcGFja2FnZXMvcGlnbWVudHMvc3BlYy9oZWxwZXJzL2V2ZW50cy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLEtBQUEsR0FBUSxTQUFDLElBQUQsRUFBTyxVQUFQOztNQUFPLGFBQVc7O1dBQVcsSUFBQSxLQUFBLENBQU0sSUFBTixFQUFZLFVBQVo7RUFBN0I7O0VBRVIsVUFBQSxHQUFhLFNBQUMsSUFBRCxFQUFPLFVBQVA7QUFDWCxRQUFBO0lBQUEsUUFBQSxHQUFXO01BQ1QsT0FBQSxFQUFTLElBREE7TUFFVCxVQUFBLEVBQWEsSUFBQSxLQUFVLFdBRmQ7TUFHVCxJQUFBLEVBQU0sTUFIRztNQUlULE1BQUEsRUFBUSxDQUpDO01BS1QsS0FBQSxFQUFPLENBTEU7TUFNVCxLQUFBLEVBQU8sQ0FORTtNQU9ULE9BQUEsRUFBUyxDQVBBO01BUVQsT0FBQSxFQUFTLENBUkE7TUFTVCxPQUFBLEVBQVMsS0FUQTtNQVVULE1BQUEsRUFBUSxLQVZDO01BV1QsUUFBQSxFQUFVLEtBWEQ7TUFZVCxPQUFBLEVBQVMsS0FaQTtNQWFULE1BQUEsRUFBUSxDQWJDO01BY1QsYUFBQSxFQUFlLE1BZE47O0FBaUJYLFNBQUEsYUFBQTs7VUFBK0M7UUFBL0MsVUFBVyxDQUFBLENBQUEsQ0FBWCxHQUFnQjs7QUFBaEI7V0FFSSxJQUFBLFVBQUEsQ0FBVyxJQUFYLEVBQWlCLFVBQWpCO0VBcEJPOztFQXNCYix1QkFBQSxHQUEwQixTQUFDLE1BQUQ7QUFDeEIsUUFBQTtJQUFBLE1BQTZCLE1BQU0sQ0FBQyxxQkFBUCxDQUFBLENBQTdCLEVBQUMsYUFBRCxFQUFNLGVBQU4sRUFBWSxpQkFBWixFQUFtQjtXQUNuQjtNQUFDLENBQUEsRUFBRyxJQUFBLEdBQU8sS0FBQSxHQUFRLENBQW5CO01BQXNCLENBQUEsRUFBRyxHQUFBLEdBQU0sTUFBQSxHQUFTLENBQXhDOztFQUZ3Qjs7RUFJMUIsTUFBTSxDQUFDLE9BQVAsR0FBaUI7SUFBQyx5QkFBQSx1QkFBRDtJQUEwQixZQUFBLFVBQTFCO0lBQXNDLE9BQUEsS0FBdEM7OztFQUVqQixDQUFDLFdBQUQsRUFBYyxXQUFkLEVBQTJCLFNBQTNCLEVBQXNDLE9BQXRDLENBQThDLENBQUMsT0FBL0MsQ0FBdUQsU0FBQyxHQUFEO1dBQ3JELE1BQU0sQ0FBQyxPQUFRLENBQUEsR0FBQSxDQUFmLEdBQXNCLFNBQUMsTUFBRCxFQUFTLENBQVQsRUFBWSxDQUFaLEVBQWUsRUFBZixFQUFtQixFQUFuQixFQUF1QixHQUF2QjtBQUNwQixVQUFBO01BQUEsSUFBQSxDQUFBLENBQStDLFdBQUEsSUFBTyxXQUF0RCxDQUFBO1FBQUEsTUFBUSx1QkFBQSxDQUF3QixNQUF4QixDQUFSLEVBQUMsU0FBRCxFQUFHLFVBQUg7O01BRUEsSUFBQSxDQUFBLENBQU8sWUFBQSxJQUFRLFlBQWYsQ0FBQTtRQUNFLEVBQUEsR0FBSztRQUNMLEVBQUEsR0FBSyxFQUZQOzthQUlBLE1BQU0sQ0FBQyxhQUFQLENBQXFCLFVBQUEsQ0FBVyxHQUFYLEVBQWdCO1FBQUMsUUFBQSxNQUFEO1FBQVMsS0FBQSxFQUFPLENBQWhCO1FBQW1CLEtBQUEsRUFBTyxDQUExQjtRQUE2QixPQUFBLEVBQVMsRUFBdEM7UUFBMEMsT0FBQSxFQUFTLEVBQW5EO1FBQXVELE1BQUEsRUFBUSxHQUEvRDtPQUFoQixDQUFyQjtJQVBvQjtFQUQrQixDQUF2RDs7RUFVQSxNQUFNLENBQUMsT0FBTyxDQUFDLFVBQWYsR0FBNEIsU0FBQyxNQUFELEVBQVMsTUFBVCxFQUFtQixNQUFuQjs7TUFBUyxTQUFPOzs7TUFBRyxTQUFPOztXQUNwRCxNQUFNLENBQUMsYUFBUCxDQUFxQixVQUFBLENBQVcsWUFBWCxFQUF5QjtNQUFDLFFBQUEsTUFBRDtNQUFTLFFBQUEsTUFBVDtNQUFpQixRQUFBLE1BQWpCO0tBQXpCLENBQXJCO0VBRDBCOztFQUc1QixNQUFNLENBQUMsT0FBTyxDQUFDLE1BQWYsR0FBd0IsU0FBQyxNQUFEO1dBQ3RCLE1BQU0sQ0FBQyxhQUFQLENBQXFCLEtBQUEsQ0FBTSxRQUFOLEVBQWdCO01BQUMsUUFBQSxNQUFEO0tBQWhCLENBQXJCO0VBRHNCO0FBM0N4QiIsInNvdXJjZXNDb250ZW50IjpbImV2ZW50ID0gKHR5cGUsIHByb3BlcnRpZXM9e30pIC0+IG5ldyBFdmVudCB0eXBlLCBwcm9wZXJ0aWVzXG5cbm1vdXNlRXZlbnQgPSAodHlwZSwgcHJvcGVydGllcykgLT5cbiAgZGVmYXVsdHMgPSB7XG4gICAgYnViYmxlczogdHJ1ZVxuICAgIGNhbmNlbGFibGU6ICh0eXBlIGlzbnQgXCJtb3VzZW1vdmVcIilcbiAgICB2aWV3OiB3aW5kb3dcbiAgICBkZXRhaWw6IDBcbiAgICBwYWdlWDogMFxuICAgIHBhZ2VZOiAwXG4gICAgY2xpZW50WDogMFxuICAgIGNsaWVudFk6IDBcbiAgICBjdHJsS2V5OiBmYWxzZVxuICAgIGFsdEtleTogZmFsc2VcbiAgICBzaGlmdEtleTogZmFsc2VcbiAgICBtZXRhS2V5OiBmYWxzZVxuICAgIGJ1dHRvbjogMFxuICAgIHJlbGF0ZWRUYXJnZXQ6IHVuZGVmaW5lZFxuICB9XG5cbiAgcHJvcGVydGllc1trXSA9IHYgZm9yIGssdiBvZiBkZWZhdWx0cyB3aGVuIG5vdCBwcm9wZXJ0aWVzW2tdP1xuXG4gIG5ldyBNb3VzZUV2ZW50IHR5cGUsIHByb3BlcnRpZXNcblxub2JqZWN0Q2VudGVyQ29vcmRpbmF0ZXMgPSAodGFyZ2V0KSAtPlxuICB7dG9wLCBsZWZ0LCB3aWR0aCwgaGVpZ2h0fSA9IHRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVxuICB7eDogbGVmdCArIHdpZHRoIC8gMiwgeTogdG9wICsgaGVpZ2h0IC8gMn1cblxubW9kdWxlLmV4cG9ydHMgPSB7b2JqZWN0Q2VudGVyQ29vcmRpbmF0ZXMsIG1vdXNlRXZlbnQsIGV2ZW50fVxuXG5bJ21vdXNlZG93bicsICdtb3VzZW1vdmUnLCAnbW91c2V1cCcsICdjbGljayddLmZvckVhY2ggKGtleSkgLT5cbiAgbW9kdWxlLmV4cG9ydHNba2V5XSA9ICh0YXJnZXQsIHgsIHksIGN4LCBjeSwgYnRuKSAtPlxuICAgIHt4LHl9ID0gb2JqZWN0Q2VudGVyQ29vcmRpbmF0ZXModGFyZ2V0KSB1bmxlc3MgeD8gYW5kIHk/XG5cbiAgICB1bmxlc3MgY3g/IGFuZCBjeT9cbiAgICAgIGN4ID0geFxuICAgICAgY3kgPSB5XG5cbiAgICB0YXJnZXQuZGlzcGF0Y2hFdmVudChtb3VzZUV2ZW50IGtleSwge3RhcmdldCwgcGFnZVg6IHgsIHBhZ2VZOiB5LCBjbGllbnRYOiBjeCwgY2xpZW50WTogY3ksIGJ1dHRvbjogYnRufSlcblxubW9kdWxlLmV4cG9ydHMubW91c2V3aGVlbCA9ICh0YXJnZXQsIGRlbHRhWD0wLCBkZWx0YVk9MCkgLT5cbiAgdGFyZ2V0LmRpc3BhdGNoRXZlbnQobW91c2VFdmVudCAnbW91c2V3aGVlbCcsIHt0YXJnZXQsIGRlbHRhWCwgZGVsdGFZfSlcblxubW9kdWxlLmV4cG9ydHMuY2hhbmdlID0gKHRhcmdldCkgLT5cbiAgdGFyZ2V0LmRpc3BhdGNoRXZlbnQoZXZlbnQgJ2NoYW5nZScsIHt0YXJnZXR9KVxuIl19
