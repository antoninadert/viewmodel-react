const changeBinding = function(eb) {
  return (
    eb.value ||
    eb.check ||
    eb.text ||
    eb.html ||
    eb.focus ||
    eb.hover ||
    eb.toggle ||
    eb.if ||
    eb.visible ||
    eb.unless ||
    eb.hide ||
    eb.enable ||
    eb.disable ||
    eb.ref
  );
};

export default [
  {
    name: "default",
    bind: function(bindArg) {
      if (
        bindArg.bindName in bindArg.element &&
        !(bindArg.element[bindArg.bindName] instanceof Function)
      ) {
        // It's an attribute or a component so don't add it as an event
        return;
      }
      const eventListener = function(event) {
        bindArg.setVmValue(event);
      };

      bindArg.element.addEventListener(bindArg.bindName, eventListener);
      bindArg.component.vmDestroyed.push(() => {
        bindArg.element.removeEventListener(bindArg.bindName, eventListener);
      });
    }
  },
  {
    name: "value",
    events: {
      "input change": function(bindArg) {
        let newVal = bindArg.element.value;
        let vmVal = bindArg.getVmValue();
        vmVal = vmVal == null ? "" : vmVal.toString();
        if (
          newVal !== vmVal ||
          (bindArg.elementBind.throttle &&
            (!bindArg.component[bindArg.bindValue].hasOwnProperty("nextVal") ||
              newVal !== bindArg.component[bindArg.bindValue].nextVal))
        ) {
          if (bindArg.elementBind.throttle) {
            bindArg.component[bindArg.bindValue].nextVal = newVal;
          }
          bindArg.setVmValue(newVal);
        }
      }
    },
    autorun: function(bindArg) {
      let newVal = bindArg.getVmValue();
      newVal = newVal == null ? "" : newVal.toString();
      if (newVal !== bindArg.element.value) {
        bindArg.element.value = newVal;
      }
      var event = document.createEvent("HTMLEvents");
      event.initEvent("change", true, false);
      bindArg.element.dispatchEvent(event);
    }
  },

  {
    name: "check",
    events: {
      change: function(bindArg) {
        bindArg.setVmValue(bindArg.element.checked);
      }
    },
    autorun: function(bindArg) {
      const vmValue = bindArg.getVmValue();
      const elementCheck = bindArg.element.checked;
      if (elementCheck !== vmValue) {
        return (bindArg.element.checked = vmValue);
      }
    }
  },
  {
    name: "check",
    selector: "input[type=radio]",
    bind: function(bindArg) {
      const name = bindArg.element.name;
      if (name) {
        const refs = bindArg.component.vmReferences;
        if (!refs.radios) {
          refs.radios = { [name]: [] };
        } else if (!refs.radios[name]) {
          refs.radios[name] = [];
        }
        refs.radios[name].push(bindArg.element);
      }
    },
    events: {
      change: function(bindArg) {
        const checked = bindArg.element.checked;
        bindArg.setVmValue(checked);
        const name = bindArg.element.name;
        if (checked && name) {
          const event = document.createEvent("HTMLEvents");
          event.initEvent("change", true, false);
          const inputs = bindArg.component.vmReferences.radios[name];
          inputs.forEach(input => {
            if (input !== bindArg.element) {
              input.dispatchEvent(event);
            }
          });
        }
      }
    },
    autorun: function(bindArg) {
      const vmValue = bindArg.getVmValue();
      const elementCheck = bindArg.element.checked;
      if (elementCheck !== vmValue) {
        return (bindArg.element.checked = vmValue);
      }
    }
  },
  {
    name: "group",
    selector: "input[type=checkbox]",
    events: {
      change: function(bindArg) {
        const vmValue = bindArg.getVmValue();
        const elementValue = bindArg.element.value;
        if (bindArg.element.checked) {
          if (vmValue.indexOf(elementValue) < 0) {
            return vmValue.push(elementValue);
          }
        } else {
          return vmValue.remove(elementValue);
        }
      }
    },
    autorun: function(bindArg) {
      const vmValue = bindArg.getVmValue();
      const elementCheck = bindArg.element.checked;
      const elementValue = bindArg.element.value;
      const newValue = vmValue.indexOf(elementValue) >= 0;
      if (elementCheck !== newValue) {
        return (bindArg.element.checked = newValue);
      }
    }
  },
  {
    name: "group",
    selector: "input[type=radio]",
    bind: function(bindArg) {
      const name = bindArg.element.name;
      if (name) {
        const refs = bindArg.component.vmReferences;
        if (!refs.radios) {
          refs.radios = { [name]: [] };
        } else if (!refs.radios[name]) {
          refs.radios[name] = [];
        }
        refs.radios[name].push(bindArg.element);
      }
    },
    events: {
      change: function(bindArg) {
        if (bindArg.element.checked) {
          bindArg.setVmValue(bindArg.element.value);

          const name = bindArg.element.name;
          if (name) {
            const event = document.createEvent("HTMLEvents");
            event.initEvent("change", true, false);
            const inputs = bindArg.component.vmReferences.radios[name];
            inputs.forEach(input => {
              if (input !== bindArg.element) {
                input.dispatchEvent(event);
              }
            });
          }
        }
      }
    },
    autorun: function(bindArg) {
      const vmValue = bindArg.getVmValue();
      const elementValue = bindArg.element.value;
      return (bindArg.element.checked = vmValue === elementValue);
    }
  },
  {
    name: "enter",
    events: {
      keyup: function(bindArg, event) {
        if (event.which === 13 || event.keyCode === 13) {
          bindArg.setVmValue(event);
        }
      }
    }
  },
  {
    name: "esc",
    events: {
      keyup: function(bindArg, event) {
        if (event.which === 27 || event.keyCode === 27) {
          bindArg.setVmValue(event);
        }
      }
    }
  },
  {
    name: "change",
    bind: function(bindArg) {
      const bindValue = changeBinding(bindArg.elementBind);
      bindArg.autorun(function(bindArg, c) {
        const newValue = bindArg.getVmValue(bindValue);
        if (!c.firstRun) {
          bindArg.setVmValue(newValue);
        }
      });
    },
    bindIf: function(bindArg) {
      return changeBinding(bindArg.elementBind);
    }
  },
  {
    name: "hover",
    events: {
      mouseenter: function(bindArg) {
        bindArg.setVmValue(true);
      },
      mouseleave: function(bindArg) {
        bindArg.setVmValue(false);
      }
    }
  },
  {
    name: "focus",
    events: {
      focus: function(bindArg) {
        if (!bindArg.getVmValue()) bindArg.setVmValue(true);
      },
      blur: function(bindArg) {
        if (bindArg.getVmValue()) bindArg.setVmValue(false);
      }
    },
    autorun: function(bindArg) {
      const value = bindArg.getVmValue();
      if (bindArg.element === document.activeElement !== value) {
        if (value) {
          bindArg.element.focus();
        } else {
          bindArg.element.blur();
        }
      }
    }
  },
  {
    name: "toggle",
    events: {
      click: function(bindArg) {
        bindArg.setVmValue(!bindArg.getVmValue());
      }
    }
  },
  {
    name: "ref",
    bind: function(bindArg) {
      bindArg.component[bindArg.bindValue] = bindArg.element;
    }
  }
];
