// 规格选择组件
const { useState } = React;

function SpecSelector({ specs, onSpecChange }) {
    const [selectedSpecs, setSelectedSpecs] = useState({});

    const handleSpecClick = (specName, option) => {
        const newSelectedSpecs = {
            ...selectedSpecs,
            [specName]: option
        };
        setSelectedSpecs(newSelectedSpecs);
        if (onSpecChange) {
            onSpecChange(newSelectedSpecs);
        }
    };

    const isSpecSelected = (specName, option) => {
        return selectedSpecs[specName]?.id === option.id;
    };

    return (
        <div className="spec-selector">
            {specs.map((spec) => (
                <div key={spec.name} className="spec-group">
                    <h3 className="spec-title">{spec.name}</h3>
                    <div className="spec-options">
                        {spec.options.map((option) => (
                            <button
                                key={option.id}
                                className={`spec-option ${isSpecSelected(spec.name, option) ? 'selected' : ''}`}
                                onClick={() => handleSpecClick(spec.name, option)}
                            >
                                {option.image && (
                                    <img src={option.image} alt={option.name} className="spec-option-image" />
                                )}
                                <span>{option.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
