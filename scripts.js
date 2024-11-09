document.addEventListener('DOMContentLoaded', async () => {
    const searchBox = document.getElementById('searchBox');
    const resultDiv = document.getElementById('result');
    const ghostText = document.getElementById('ghostText');
    const searchContainer = document.querySelector('.search-box');

    let dictionaryData = {};
    let clickableWords = {};
    let entryWords = {};
    let specialWords = {};
    let currentMeaningIndex = {};
    let lastQuery = '';
    let isVocabularyLoaded = false;
    let typeWords = {};
    let wordIndex = 0;
    let animationInterval;
    let words = ["entries", "suffixes", "languages"];  // Başlangıç değeri
    function loadSearchFromHash() {
        if (!isVocabularyLoaded) return;
    
        let hash = decodeURIComponent(window.location.hash.substring(1));
        hash = toTurkishLowerCase(hash);
        const cleanedHash = hash.replace(/[^abcçdefgğhıijklmnoöprsştuüvyz ]/g, '');
    
        if (cleanedHash === "") {
            // URL boş ise ana sayfaya yönlendir ve copyButton'ı gizle
            window.history.replaceState(null, null, `/`);
            copyButton.style.display = 'none';
        } else {
            window.history.replaceState(null, null, `#${encodeURIComponent(cleanedHash)}`);
            searchBox.value = cleanedHash;
            updateSearch(cleanedHash);
            updateSearchBoxPlaceholder(cleanedHash);
            
            // copyButton'ı güncelle
            updateCopyButton();
        }
    }
    
    
    function toTurkishLowerCase(str) {
        return str
            .replace(/I/g, 'ı')
            .replace(/İ/g, 'i')
            .replace(/Ğ/g, 'ğ')
            .replace(/Ü/g, 'ü')
            .replace(/Ş/g, 'ş')
            .replace(/Ö/g, 'ö')
            .replace(/Ç/g, 'ç')
            .toLowerCase();
    }
    
    window.addEventListener('hashchange', loadSearchFromHash);
    
    window.addEventListener('load', async () => {
        if (!window.location.hash || window.location.hash === "#") {
            window.location.hash = '#';
        }

        const isLoaded = await loadData();
        if (isLoaded) {
            loadSearchFromHash();
        }
    });

    window.addEventListener('hashchange', () => {
        if (!isVocabularyLoaded) return;
        const hash = decodeURIComponent(window.location.hash.substring(1));
        if (hash) {
            searchBox.value = hash;
            updateSearch(hash);
            updateSearchBoxPlaceholder(hash);
            updateCopyButton(); 
        } else {
            resultDiv.classList.add('hidden');
            ghostText.textContent = '';
            searchBox.value = '';
            searchContainer.classList.remove('error');
            resultDiv.innerHTML = '';
        }

        const tooltips = document.querySelectorAll('.tooltip');
        tooltips.forEach(tooltip => tooltip.remove());
    });

    searchBox.addEventListener('input', (e) => {
        let query = e.target.value;
    
        query = toTurkishLowerCase(query);
        query = query.replace(/[^abcçdefgğhıijklmnoöprsştuüvyz ]/gi, '');
        query = query.replace(/\s{2,}/g, ' ');
    
        e.target.value = query;
    
        updateSearchBoxPlaceholder(query);
        updateSearch(query); // Güncellenen arama sorgusunu updateSearch ile işliyoruz
    });
    
    
    
    function updateSearch(query) {
        const formattedQuery = toTurkishLowerCase(query).toLowerCase(); 
        
        if (dictionaryData && Object.keys(dictionaryData).length > 0) {
            searchWord(formattedQuery);
    
            // URL’yi anlık olarak güncelle
            if (query) {
                window.history.replaceState(null, null, `#${encodeURIComponent(formattedQuery)}`);
            } else {
                window.history.replaceState(null, null, `#`);
            }
        } else {
            console.error('Dictionary data not loaded.');
        }
    }
    

let lastGhostText = "";

let lastCombinedText = "";

function searchWord(query) {
    const resultDiv = document.getElementById('result');
    const copyButton = document.getElementById('copyButton');
    const searchContainer = document.querySelector('.search-box');
    const ghostText = document.getElementById('ghostText');

    // Aynı sorgu tekrar girildiyse işlemi durdur
    if (query === lastQuery) return;

    lastQuery = query;
    resultDiv.innerHTML = ''; // Sonuç alanını temizle

    // Eğer sorgu boşsa veya geçersizse işlemi durdur ve copyButton'ı gizle
    if (query.trim().length === 0) {
        searchContainer.classList.remove('error');
        searchBox.classList.remove('error');
        ghostText.textContent = "";
        lastCombinedText = ""; 
        copyButton.style.display = 'none';
        return;
    } else if (query.startsWith(' ')) {
        searchContainer.classList.add('error');
        searchBox.classList.add('error');
        ghostText.textContent = "";
        lastCombinedText = ""; 
        copyButton.style.display = 'none';
        return;
    } else {
        searchContainer.classList.remove('error');
        searchBox.classList.remove('error');
    }

    const normalizedQuery = normalizeTurkish(query);

    // Eşleşen kelimeleri bul
    const matchingWords = Object.keys(dictionaryData)
        .map(word => ({ word: normalizeTurkish(word), original: word }))
        .filter(({ word }) => word.startsWith(normalizedQuery))
        .sort((a, b) => a.word.localeCompare(b.word));

    // Eşleşme durumuna göre copyButton'ı etkin veya pasif yap
    if (matchingWords.length > 0) {
        // Eşleşme bulunduysa buton rengi --main-aluminium ve etkin
        copyButton.style.color = 'var(--main-aluminium)';
        copyButton.style.display = 'block';
        copyButton.disabled = false; // Butonu etkinleştir
    } else {
        // Eşleşme yoksa buton rengi kırmızı (#dc3545) ve pasif
        copyButton.style.color = '#dc3545';
        copyButton.disabled = true; // Butonu pasif yap
    }

    // Eşleşen kelime varsa sonuçları göster
    if (matchingWords.length > 0) {
        searchContainer.classList.remove('error');
        searchBox.classList.remove('error');

        const closestWord = matchingWords[0];
        const wordDetails = dictionaryData[closestWord.original];
        const description = wordDetails.a.replace(/\n/g, "<br>");
        const descriptionElement = document.createElement('p');
        descriptionElement.classList.add('description');
        descriptionElement.innerHTML = highlightWords(sanitizeHTML(description));
        
        resultDiv.appendChild(descriptionElement);

        const newGhostText = closestWord.word.substring(query.length);
        const newCombinedText = query + newGhostText;

        if (newCombinedText !== lastCombinedText) {
            ghostText.textContent = newGhostText;
            lastCombinedText = newCombinedText;
            resultDiv.style.animation = 'none'; 
            resultDiv.offsetHeight; 
            resultDiv.style.animation = 'fadeIn 1s ease-in-out';
            loadAnimation();
        }

        copyButton.style.display = 'block'; // Butonu göster
    } else {
        // Eşleşme yoksa hata durumunu ayarla
        ghostText.textContent = "";
        lastCombinedText = ""; 
        searchContainer.classList.add('error');
        searchBox.classList.add('error');
    }

    createClickableWords();
}






  document.addEventListener('contextmenu', event => event.preventDefault());

  document.addEventListener('keydown', (event) => {
    const forbiddenKeys = ['c', 'x', 'v', 'p', 'u'];
    if ((event.ctrlKey || event.metaKey) && forbiddenKeys.includes(event.key)) {
      event.preventDefault();
    }
  });

  window.addEventListener('keyup', (event) => {
    if (event.key === 'PrintScreen') {
      navigator.clipboard.writeText('');
    }
  });

  document.addEventListener('selectstart', event => event.preventDefault());

    function createClickableWords() {
        const wordsArray = Object.keys(clickableWords).sort((a, b) => b.length - a.length); 
    
        wordsArray.forEach(word => {
            const escapedWord = word.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1"); 
            const regex = new RegExp(`(?<=^|\\s|\\\\n|>)${escapedWord}(?=\\s|\\\\n|<|$)`, 'g'); 

            resultDiv.innerHTML = resultDiv.innerHTML.replace(
                regex,
                `<span class="clickable-word" data-word="${word}">${word}</span>`
            );
        });
    
        const clickableElements = document.querySelectorAll('.clickable-word');
        clickableElements.forEach(element => {
            element.addEventListener('click', function () {
                const word = this.getAttribute('data-word');
                this.classList.add('n'); 
                showWordMeanings(word, this); 
            });
        });
    }

    function showWordMeanings(word, element) {
        const meanings = clickableWords[word];
        const existingTooltips = document.querySelectorAll('.tooltip');
        existingTooltips.forEach(tooltip => tooltip.remove());
        if (meanings && meanings.length > 0) {
            if (!currentMeaningIndex[word]) {
                currentMeaningIndex[word] = 0;
            }
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            let meaning = "";
            meanings[currentMeaningIndex[word]].forEach(tempMeaning => meaning += tempMeaning + "<br>");
            tooltip.innerHTML = meaning;
            document.body.appendChild(tooltip);
            const elementRect = element.getBoundingClientRect();
            tooltip.style.position = 'absolute';
            tooltip.style.display = 'block';
            const tooltipRect = tooltip.getBoundingClientRect();
            let top = elementRect.top + window.scrollY - tooltipRect.height - 5;
            let left = elementRect.left + window.scrollX + (elementRect.width / 2) - (tooltipRect.width / 2);
            if (left + tooltipRect.width > window.innerWidth) {
                left = window.innerWidth - tooltipRect.width - 5;
            }
            if (left < 0) {
                left = 5;
            }
            tooltip.style.top = `${top}px`;
            tooltip.style.left = `${left}px`;
            tooltip.style.opacity = 0;
            tooltip.style.transition = 'opacity 0.3s ease-in-out';
            setTimeout(() => {
                tooltip.style.opacity = 1;
            }, 50);
            element.addEventListener('mouseleave', function () {
                tooltip.style.opacity = 0;
                setTimeout(() => {
                    tooltip.remove();
                   element.classList.remove('n')
                }, 300);
            });
            currentMeaningIndex[word] = (currentMeaningIndex[word] + 1) % meanings.length;
        }
    }
    
    function normalizeTurkish(text) {
        return text.replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase();
    }

    function sanitizeHTML(htmlString) {
        return DOMPurify.sanitize(htmlString, {
            ALLOWED_TAGS: ['span', 'br']
        });
    }

    function highlightWords(text) {
        let markedText = text;
        for (const [key, value] of Object.entries(specialWords)) {
            const regex = new RegExp(`\\b${key}\\b`, 'gi');
            markedText = markedText.replace(regex, (match) => `[SPECIAL:${key}]`);
        }

        let resultText = markedText;
        for (const [key, value] of Object.entries(specialWords)) {
            const regex = new RegExp(`\\[SPECIAL:${key}\\](\\s+)(\\S+)`, 'gi');
            resultText = resultText.replace(regex, (match, p1, p2) => `<b>${value}</b>${p1}<span class="p">${p2}</span>`);
        }

        resultText = resultText.replace(/\[SPECIAL:\S+\]/g, '');

        return resultText;
    }

    function updateSearchBoxPlaceholder(query) {
        if (!query) {
            ghostText.textContent = '';
            return;
        }
        const queryLower = normalizeTurkish(query);
        const matchingWord = Object.keys(dictionaryData)
            .map(word => ({ word: normalizeTurkish(word), original: word }))
            .sort((a, b) => a.word.localeCompare(b.word))
            .find(({ word }) => word.startsWith(queryLower));

        if (matchingWord) {
            const remainingPart = matchingWord.word.substring(query.length);
            ghostText.textContent = remainingPart;

            const inputRect = searchBox.getBoundingClientRect();
            const inputStyle = window.getComputedStyle(searchBox);
            const paddingLeft = parseFloat(inputStyle.paddingLeft);
            const fontSize = parseFloat(inputStyle.fontSize);

            const firstCharWidth = getTextWidth(query, fontSize);
            ghostText.style.left = `${paddingLeft + firstCharWidth}px`;
        } else {
            ghostText.textContent = "";
        }
    }

    function wrapClickableWords() {
        Object.keys(clickableWords).forEach(key => {
            clickableWords[key] = clickableWords[key].map(group => {
                return group.map(item => {
                    Object.entries(specialWords).forEach(([specialKey, specialValue]) => {
                        const regex = new RegExp(`\\b${specialKey}\\b`, 'gi');
                        item = item.replace(regex, `[SPECIAL:${specialKey}]`);
                    });

                    item = item.replace(/“([^”]+)”/g, '<span class="g">“$1”</span>');

                    item = item.replace(/\b(\d+)\b/g, (match) => {
                        const wordType = typeWords[match];
                        if (wordType) {
                            return `<span class="y">${wordType}</span>`;
                        }
                        return match;
                    });

                    item = item.replace(/\[SPECIAL:\S+\]/g, '');

                    return item;
                });
            });
        });
    }

    let headings = [];

    async function loadData() {
        const searchBox = document.getElementById('searchBox');
        let allDataLoaded = true;

        try {
            const clickableWordsResponse = await fetch('vocabulary/clickableWords.json');
            if (!clickableWordsResponse.ok) throw new Error('clickableWords could not be loaded');
            const clickableWordsJson = await clickableWordsResponse.json();
            clickableWords = clickableWordsJson.clickableWords;

            const specialWordsResponse = await fetch('vocabulary/specialWords.json');
            if (!specialWordsResponse.ok) throw new Error('specialWords could not be loaded');
            const specialWordsJson = await specialWordsResponse.json();
            specialWords = specialWordsJson.specialWords;

            const entryWordsResponse = await fetch('vocabulary/entryWords.json');
            if (!entryWordsResponse.ok) throw new Error('entryWords could not be loaded');
            const entryWordsJson = await entryWordsResponse.json();
            entryWords = entryWordsJson.entryWords;

            const typeWordsResponse = await fetch('vocabulary/typeWords.json');
            if (!typeWordsResponse.ok) throw new Error('typeWords could not be loaded');
            const typeWordsJson = await typeWordsResponse.json();
            typeWords = typeWordsJson.typeWords;

            dictionaryData = entryWords;
            wrapClickableWords();
            isVocabularyLoaded = true;
            searchBox.disabled = false;

            // `words` dizisini JSON dosyalarındaki kelime sayılarına göre güncelle
            words = [
                `${Object.keys(entryWords).length} entries`,
                `${Object.keys(clickableWords).length} suffixes`,
                `${Object.keys(specialWords).length} languages`
            ];

        } catch (error) {
            console.error('Error:', error);
            allDataLoaded = false;
            setTimeout(() => {
                searchBox.disabled = true;
            }, 1000);
        }
        return allDataLoaded;
    }
    

let loaderAnimationTimeout = null;
function loadAnimation() {
    if (loaderAnimationTimeout) window.clearTimeout(loaderAnimationTimeout);
    const loader = document.querySelector('.Loader');
    loader.classList.remove('animate');
    loader.classList.add('animate');
    loaderAnimationTimeout = window.setTimeout(() => {
        loader.classList.remove('animate');
    }, 1000)
}
    function getTextWidth(text, fontSize) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = `${fontSize}px 'Poppins', sans-serif`;
        return context.measureText(text).width;
    }
    
    
const copyButton = document.getElementById('copyButton');

searchBox.addEventListener('input', () => {
    const query = searchBox.value.trim();
    updateSearchBoxPlaceholder(query);
    searchWord(query);

    // Show or hide the copy button based on input content
    copyButton.style.display = query.length > 0 ? 'block' : 'none';
});


    document.querySelector('#result').addEventListener('click', (e) => {
        if (e.target.classList.contains('searchable')) {
            const searchbox = document.querySelector('#searchBox');
            searchBox.value = e.target.textContent;
            searchBox.dispatchEvent(new Event('input'));
        }
    });
    document.getElementById('copyButton').addEventListener('click', () => {
    const searchBox = document.getElementById('searchBox');
    const resultDiv = document.getElementById('result');
    const searchQuery = searchBox.value.trim();
    const searchResult = resultDiv.textContent.trim();
    const sourceUrl = window.location.href;
    const copyButton = document.getElementById('copyButton');
    
    copyButton.copyLabel = '';
    copyButton.successLabel = '';
    if (searchQuery && searchResult) {
        const copyText = `${searchQuery}\n\n\n${searchResult}\n\n\n\nSource: ${sourceUrl}`;
        navigator.clipboard.writeText(copyText).catch(err => {
            console.error('Kopyalama hatası:', err);
        });
    }
});

copyButton.style.display = 'none';
    const animatedText = document.getElementById('animatedText');
    function animateText() {
        if (searchBox.value || document.activeElement === searchBox) {
            animatedText.style.display = 'none';
            return;
        }

        animatedText.style.display = 'block';
        animatedText.textContent = words[wordIndex];
        animatedText.style.animation = 'none';
        void animatedText.offsetWidth;  // Reflow tetikleme
        animatedText.style.animation = 'slideInOut 2s ease-in-out';

        wordIndex = (wordIndex + 1) % words.length;
        animationInterval = setTimeout(animateText, 2000);
    }

    // `loadData` tamamlandığında animasyon başlasın
    const dataLoaded = await loadData();
    if (dataLoaded && !searchBox.value) {
        setTimeout(animateText, 500);  // 0.5 saniye sonra animasyonu başlat
    }

    // `input` olayında animasyonu kontrol et
    searchBox.addEventListener('input', () => {
        if (searchBox.value) {
            animatedText.style.display = 'none';
        } else if (!document.activeElement === searchBox) {
            animateText();
        }
    });

    // `focus` olayında animasyonu durdur
    searchBox.addEventListener('focus', () => {
        animatedText.style.display = 'none';
        clearTimeout(animationInterval);
    });

    // `blur` olayında ve `searchBox` boşsa animasyonu başlat
    searchBox.addEventListener('blur', () => {
        if (!searchBox.value) animateText();
    });
    function updateCopyButton() {
        const query = searchBox.value.trim();
        
        if (query) {
            // Query ile eşleşen bir kelime olup olmadığını kontrol et
            const normalizedQuery = normalizeTurkish(query);
            const matchingWords = Object.keys(dictionaryData)
                .map(word => normalizeTurkish(word))
                .filter(word => word.startsWith(normalizedQuery));
    
            if (matchingWords.length > 0) {
                // Eşleşme bulunduğunda, buton görünür ve --main-aluminium renginde olur
                copyButton.style.display = 'block';
                copyButton.style.color = 'var(--main-aluminium)';
                copyButton.disabled = false;
            } else {
                // Eşleşme bulunmadığında, buton kırmızı (#dc3545) olur ve pasif hale gelir
                copyButton.style.display = 'block';
                copyButton.style.color = '#dc3545';
                copyButton.disabled = true;
            }
        } else {
            // Sorgu boş olduğunda butonu gizle
            copyButton.style.display = 'none';
            copyButton.disabled = true;
        }
    }
    
    
});
