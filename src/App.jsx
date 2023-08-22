import { useState } from 'react';
import TagsInput from './components/TagsInput';

function App() {
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleTrySubmit = () => {
    console.log('Tried Submi');
  };

  return (
    <div className="p-4">
      <TagsInput
        className="flex-1"
        tags={keywords}
        setTags={setKeywords}
        minTags={2}
        maxTags={5}
        tagMinChars={2}
        tagMaxChars={12}
        disabled={loading}
        placeholder={`Type ${2} - ${5} keywords ...`}
        onSubmit={handleTrySubmit}
      />
    </div>
  );
}

export default App;
