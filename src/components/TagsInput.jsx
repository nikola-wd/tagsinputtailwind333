import React, { useState, useRef, useEffect, useCallback } from 'react';
import classNames from 'classnames';
import { AnimatePresence, motion } from 'framer-motion';

const regexAlphaNumericOnly = /^[a-zA-Z0-9 ,]+$/;

const isPhone =
  /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

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

const isBackspaceKey = (e, androidChrome) => {
  const Backspace = !androidChrome
    ? 'Backspace'
    : getMappedKey(e.nativeEvent.inputType);
  return checkKey(Backspace, androidChrome ? e.nativeEvent.data : e.key);
};

const isCommaOrSpaceKey = (key) => {
  return checkKey(',', key) || checkKey(' ', key);
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
  const tagsWrapCls =
    'bg-white border-2 rounded p-1 py-[8px] flex flex-wrap gap-[4px] relative focus-within:ring-blue focus-within:ring-2 focus-within:ring-offset-2  min-h-9';
  const tagCls =
    'relative bg-gray-100 text-blue text-lg font-bold hover:text-red px-[10px] py-[4px] rounded-sm inline-flex items-center justify-between gap-1 outline-none focus:ring-blue focus:ring-2 focus:ring-offset-2 transition-colors m-2';
  const tagsInputCls =
    'outline-none bg-transparent flex-grow placeholder:text-3xl text-3xl placeholder:text-gray-500 text-black placeholder:font-bold font-bold pl-2';

  const maxTagsReached = tags.length >= maxTags;

  const isTagValid = (tag) => {
    return (
      tag.length >= tagMinChars &&
      tag.length <= tagMaxChars &&
      tags.length < maxTags &&
      !tags.some((t) => t.toLowerCase() === tag.toLowerCase()) &&
      !/^[, ]*$/.test(tag) // disallow tags that are just spaces or commas
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

  const handleTagRemove = (tag) => {
    const newTags = tags.filter((t) => t !== tag);
    setTags(newTags);
    checkTagLimits(newTags);
    inputRef.current.focus();
  };

  const handleInputChange = (e) => {
    let sanitizedValue = e.target.value;

    if (sanitizedValue.startsWith(',') || sanitizedValue.startsWith(' ')) {
      sanitizedValue = '';
    }

    if (isAndroidChrome()) {
      sanitizedValue = sanitizedValue.replace(/,|\s+/g, '');
    }

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

  const tryRemoveLastTag = () => {
    if (!!inputValue || !tags.length) return;
    const newTags = tags.slice(0, -1);
    setTags(newTags);
    checkTagLimits(newTags);
  };

  const tryAddTagFromInput = useCallback(() => {
    let trimmedInputValue = inputValue.trim();

    if (trimmedInputValue && isTagValid(trimmedInputValue)) {
      const newTags = [...tags, trimmedInputValue];
      if (newTags.length <= maxTags) {
        const event = new Event('resetInput');
        window.dispatchEvent(event);
        setTags(newTags);
        checkTagLimits(newTags);
        return true;
      }
    }
    return false;
  }, [inputValue, setInputValue, tags, setTags, checkTagLimits, maxTags]);

  // hacky fix for chrome android not clearing input value after tag is added
  const handlePhoneNuances = useCallback(
    (e) => {
      if (!isPhone) return;

      switch (e.key) {
        case 'Backspace':
          isAndroidChrome() && tryRemoveLastTag();
          break;
        case 'Enter':
          tryAddTagFromInput();
          break;
        default:
          break;
      }
    },
    [tryRemoveLastTag, tryAddTagFromInput]
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

  const handleTagsLogic = (e) => {
    const androidChrome = isAndroidChrome(e);
    const key = androidChrome ? e?.nativeEvent?.data || e?.key : e.key;

    // Disallow "," or " " when the input is empty
    if ((key === ',' || key === ' ') && e.target.value.trim() === '') {
      e.preventDefault();
      return;
    }

    switch (key) {
      case 'Enter':
        if (!isPhone) {
          e.preventDefault();
          const tagAdded = tryAddTagFromInput();

          if (tagAdded && tags.length + 1 >= maxTags) {
            onSubmit?.();
          }
          return;
        }
      case 'Backspace':
        if (isBackspaceKey(e, androidChrome)) {
          tryRemoveLastTag();
          return;
        }
        break;
      case ',':
      case ' ':
        if (isCommaOrSpaceKey(key)) {
          if (inputValue.trim() === '') {
            e.preventDefault();
            return;
          }

          if (!inputValue.match(/^\s*$/)) {
            e.preventDefault();
            tryAddTagFromInput();
            return;
          }
        }
        break;
      case 'Tab':
        if (!androidChrome) {
          e.preventDefault();
          tryAddTagFromInput();
          return;
        }
        break;
      default:
        break;
    }

    const currEl = e.target;
    const shouldPreventDefaultConditions = [
      tags.length >= maxTags && isBackspaceKey(e, androidChrome),
      !regexAlphaNumericOnly.test(key),
      checkKey(' ', key) && currEl.value[currEl.selectionStart - 1] === ' ',
      checkKey(',', key) && currEl.value[currEl.selectionStart - 1] === ',',
      isCommaOrSpaceKey(key) && !isTagValid(inputValue.trim()),
    ];
    if (shouldPreventDefaultConditions.some((condition) => condition)) {
      !maxTagsReached && e.preventDefault();
    }
  };

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

  return (
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
            aria-label={`Remove tag ${tag}`}
            onKeyDown={(e) => e.key === 'Backspace' && handleTagRemove(tag)}
            {...tagAnimationProps}
          >
            {tag}
          </motion.button>
        ))}
      </AnimatePresence>

      <label id="tagsLabel" className="sr-only">
        Tags
      </label>
      <input
        ref={inputRef}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleTagsLogic}
        onInput={handleTagsLogic}
        onKeyUp={handlePhoneNuances}
        onPaste={handlePaste}
        className={tagsInputCls}
        placeholder={`${maxTagsReached ? 'Limit reached' : placeholder}`}
        disabled={disabled}
        aria-disabled={disabled}
        aria-labelledby="tagsLabel"
      />
      {disabled && <DisabledDivOverlay />}
    </div>
  );
};

export default TagsInput;
