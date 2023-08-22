import React, { useState, useRef, useEffect, useCallback } from 'react';
import classNames from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';

const tagsWrapCls =
  'bg-white border-2 rounded p-1 py-[8px] flex flex-wrap gap-[4px] relative focus-within:ring-blue focus-within:ring-2 focus-within:ring-offset-2  min-h-9';
const tagCls =
  'relative bg-gray-100 text-blue text-lg font-bold hover:text-red px-[10px] py-[4px] rounded-sm inline-flex items-center justify-between gap-1 outline-none focus:ring-blue focus:ring-2 focus:ring-offset-2 transition-colors m-2';
const tagsInputCls =
  'outline-none bg-transparent flex-grow placeholder:text-3xl text-3xl placeholder:text-gray-500 text-black placeholder:font-bold font-bold pl-2';

const regexAlphaNumericOnly = /^[a-zA-Z0-9 ,]+$/;

const isAndroidChrome = (e) => {
  const lowerCaseUserAgent = window.navigator.userAgent.toLowerCase();
  return (
    lowerCaseUserAgent.includes('android') &&
    lowerCaseUserAgent.includes('chrome')
  );
};

function checkKey(key, eventKey, negate = false) {
  return negate ? eventKey !== key : eventKey === key;
}

const getMappedKey = (inputType) => {
  return (
    {
      deleteContentBackward: 'Backspace',
    }[inputType] || null
  );
};

const DisabledDivOverlay = () => (
  <div className="absolute inset-0 bg-gray-800 opacity-40 cursor-not-allowed" />
);

const TagsInput = ({
  tags = [],
  setTags,
  minTags = 3,
  maxTags = 10,
  tagMinChars = 2,
  tagMaxChars = 12,
  placeholder = 'Add a tag ...',
  disabled,
  onSubmit,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState(false);

  const inputRef = useRef();

  const maxTagsReached = tags.length >= maxTags;

  const isTagValid = (tag) => {
    console.log('Tag to be checked: ', tag);

    return (
      tag.length >= tagMinChars &&
      tag.length <= tagMaxChars &&
      tags.length < maxTags &&
      !tags.some((t) => t.toLowerCase() === tag.toLowerCase())
    );
  };

  const checkTagLimits = (newTags) => {
    const newTagCount = newTags.length;
    if (newTagCount < minTags || newTagCount > maxTags) {
      setError(true);
    } else {
      setError(false);
    }
  };

  const handleInputChange = (e) => {
    let sanitizedValue = e.target.value;

    // Replace or remove any undesired characters
    // This regex will remove anything that's not alphanumeric, space, or comma.
    sanitizedValue = sanitizedValue.replace(/[^a-zA-Z0-9 ,]/g, '');

    if (tags.length < maxTags && sanitizedValue.length <= tagMaxChars) {
      setInputValue(sanitizedValue);
    }
  };

  const tagAnimationProps = {
    initial: { scale: 0.8 },
    animate: { scale: 1 },
    exit: { scale: 0.8 },
    transition: { duration: 0.1 },
  };

  // hacky fix for chrome android not clearing input value after tag is added
  const handleKeyUpBackspaceAndroid = useCallback(
    (e) => {
      if (
        isAndroidChrome(e) &&
        e?.key === 'Backspace' &&
        e.target === inputRef.current &&
        !inputRef.current.value &&
        tags.length
      ) {
        const newTags = tags.slice(0, -1);
        setTags(newTags);
        checkTagLimits(newTags);
      }
    },
    [tags.length, inputRef.current, setTags, checkTagLimits]
  );

  // Fix for Android Chrome not clearing input value after tag is added
  useEffect(() => {
    const resetInputHandler = () => {
      setTimeout(() => {
        setInputValue('');
      }, 0);
    };

    window.addEventListener('resetInput', resetInputHandler);

    return () => {
      window.removeEventListener('resetInput', resetInputHandler);
    };
  }, [setInputValue]);

  const addTagFromInput = useCallback(() => {
    let trimmedInputValue = inputValue.trim();
    if (trimmedInputValue.endsWith(',') || trimmedInputValue.endsWith(' ')) {
      trimmedInputValue = trimmedInputValue.slice(0, -1);
      setInputValue(trimmedInputValue);
    }

    console.log(
      'FROM INSIDE addTagFromInput trimmedInputValue: ',
      trimmedInputValue
    );

    if (trimmedInputValue && isTagValid(trimmedInputValue)) {
      const newTags = [...tags, trimmedInputValue];
      if (newTags.length <= maxTags) {
        const event = new Event('resetInput');
        window.dispatchEvent(event);
        setTags(newTags);

        checkTagLimits(newTags);
      }
    }
  }, [inputValue, setInputValue, tags, setTags, checkTagLimits, maxTags]);

  const handleTagsLogic = (e) => {
    const androidChrome = isAndroidChrome(e);

    const key = androidChrome ? e.nativeEvent.data : e.key;

    if (!androidChrome) {
      if (e.key === 'Enter') {
        e.preventDefault();
        onSubmit?.();
        return;
      }
    }

    let Backspace = !androidChrome
      ? 'Backspace'
      : getMappedKey(e.nativeEvent.inputType);

    const shouldPreventDefault =
      (tags.length >= maxTags && checkKey(Backspace, key, true)) ||
      !regexAlphaNumericOnly.test(key) ||
      (checkKey(' ', key) &&
        inputRef.current.value[inputRef.current.selectionStart - 1] === ' ') ||
      (checkKey(',', key) &&
        inputRef.current.value[inputRef.current.selectionStart - 1] === ',') ||
      ((checkKey(',', key) || checkKey(' ', key)) &&
        !isTagValid(inputValue.trim()));

    const shouldFocusNext =
      !androidChrome && checkKey('Tab', key) && !!inputValue;

    // TODO: Maybe not needed for android
    const shouldRemoveTag = checkKey(Backspace, key) && !inputValue;

    const shouldAddTagFromInput =
      (checkKey(',', key) || checkKey(' ', key)) &&
      !inputValue.match(/^\s*$/) &&
      isTagValid(inputValue.trim());

    // TODO: maybe prevent default on top
    if (shouldPreventDefault) {
      !maxTagsReached && e.preventDefault();
    }

    if (shouldAddTagFromInput) {
      console.log('called 1111111111111111111');
      e.preventDefault();
      addTagFromInput();
      return;
    }

    if (shouldRemoveTag) {
      const newTags = tags.slice(0, -1);
      setTags(newTags);
      checkTagLimits(newTags);
      return;
    }

    if (!androidChrome && shouldFocusNext) {
      console.log('called 2222222222222222');

      e.preventDefault();
      addTagFromInput();
      return;
    }

    // TODO: What does this do? !inputValue.match(/^\s*$/)
  };

  // TODO: Add wai aria elements to all the interactable UI

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain');
    const alphanumericData = pastedData
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replace(/\s+/g, ' ');
    const newTags = alphanumericData
      .split(' ')
      .filter((tag) => tag !== '' && !tags.includes(tag))
      .slice(0, maxTags - tags.length); // Limit the number of tags added from pasted string
    setTags([...tags, ...newTags]);

    checkTagLimits([...tags, ...newTags]);
  };

  const handleTagRemove = (tag) => {
    const newTags = tags.filter((t) => t !== tag);
    setTags(newTags);
    checkTagLimits(newTags);
    inputRef.current.focus();
  };

  return (
    <div>
      <h4>Input Value: {inputValue}</h4>
      <div
        className={classNames(
          tagsWrapCls,
          error ? 'border-red' : 'border-gray-300',
          className
        )}
      >
        <AnimatePresence>
          {tags.map((tag, index) => (
            <motion.button
              type="button"
              key={tag}
              className={tagCls}
              onClick={() => handleTagRemove(tag)}
              onKeyDown={(e) => e.key === 'Backspace' && handleTagRemove(tag)}
              {...tagAnimationProps}
            >
              {tag}
            </motion.button>
          ))}
        </AnimatePresence>

        <input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleTagsLogic}
          onInput={handleTagsLogic}
          onKeyUp={handleKeyUpBackspaceAndroid}
          onPaste={handlePaste}
          className={tagsInputCls}
          placeholder={`${maxTagsReached ? 'Limit reached' : placeholder}`}
          disabled={disabled}
        />
        {disabled && <DisabledDivOverlay />}
      </div>
    </div>
  );
};

export default TagsInput;
