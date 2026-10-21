export const BackendError = ({error}) =>{

    return(
        <div>
            {error?.properties && (
                <div className="error-container">
                {Object.entries(error.properties).map(([fieldName, fieldData]) => {

                    return fieldData.errors && fieldData.errors.length > 0 ? (
                    <div key={fieldName} className="field-error-group">
                        
                        <ul>
                        {fieldData.errors.map((errorMsg, index) => (
                            <li key={index} className="error-message">{errorMsg}</li>
                        ))}
                        </ul>
                    </div>
                    ) : null;
                })}
                </div>
            )}
            {!error?.properties && (
                <div>
                    <p className="error-message">{error}</p>
                </div>

            )}
        </div>
    )


}