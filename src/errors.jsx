export const BackendError = ({error}) =>{

    return(
        <div>
            {error?.properties && (
                <div className="error-container">
                {Object.entries(error.properties).map(([fieldName, fieldData]) => {

                    return fieldData.errors && fieldData.errors.length > 0 ? (
                    <div key={fieldName} className="field-error-group">
                        <strong>{fieldName}:</strong>
                        <ul>
                        {fieldData.errors.map((errorMsg, index) => (
                            <li key={index} className="errortext">{errorMsg}</li>
                        ))}
                        </ul>
                    </div>
                    ) : null;
                })}
                </div>
            )}
            {!error?.properties && (
                <div>
                    <p className="errortext">{error}</p>
                </div>

            )}
        </div>
    )


}