export const formatAbilityDescription = (
    description: string,
    abilityValues: Record<string, string>
): string => {
    let formattedDescription = description.replace(/%%/g, '%');

    formattedDescription = formattedDescription.replace(/\n\n/g, '<br /><br />');
    formattedDescription = formattedDescription.replace(/\n/g, '<br />');

    formattedDescription = formattedDescription.replace(/%([a-zA-Z0-9_]+)%/g, (match, placeholder) => {
        if (abilityValues[placeholder.toLowerCase()]) {
            return `<span style="color: #ffcc00; font-weight: bold;">${abilityValues[placeholder.toLowerCase()]}</span>`;
        }
        return match;
    });

    formattedDescription = formattedDescription.replace(/(\b\d{1,3})(?: (\d{1,3})){2,3}\b/g, (match) => {
        return match.split(' ').join(' / ');
    });

    formattedDescription = formattedDescription.replace(/{"text": "(.*?)", "color": "(.*?)"}/g, (match, text, color) => {
        return `<span style="color: ${color}; font-weight: bold;">${text}</span>`;
    });


    formattedDescription = formattedDescription.replace(/\\n\\n/g, '<br/><br/>');
    formattedDescription = formattedDescription.replace(/\\n/g, '<br/>');

    return formattedDescription;
};