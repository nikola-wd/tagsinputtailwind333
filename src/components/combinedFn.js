const tags = [];

const isTagValid = (tag) => {
  console.log('Tag to be checked: ', tag);

  return (
    tag.length >= tagMinChars &&
    tag.length <= tagMaxChars &&
    tags.length < maxTags &&
    !tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  );
};

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
