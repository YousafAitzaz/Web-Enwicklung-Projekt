let clientId = '';
let clientSecret = '';

let accessToken = '';
let currentArtist = null;
let newArtist = null;
let comparedArtists = [];
let score = 0;
let highScore = 0;

async function getAccessToken() {
    const authString = btoa(`${clientId}:${clientSecret}`);
    const result = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + authString
        },
        body: 'grant_type=client_credentials'
    });

    const data = await result.json();
    if (data.access_token) {
        return data.access_token;
    } else {
        throw new Error('Failed to retrieve access token');
    }
}

async function startGame() {
    try {
        accessToken = await getAccessToken();
        console.log('Access Token:', accessToken);


        updateScoreDisplay();


        currentArtist = await getUniqueArtist();
        newArtist = await getUniqueArtist();


        displayArtist(currentArtist, 1);
        displayArtist(newArtist, 2);


        document.getElementById('higher-btn').addEventListener('click', async () => {
            await handleGuess(true);
        });

        document.getElementById('lower-btn').addEventListener('click', async () => {
            await handleGuess(false);
        });

    } catch (error) {
        console.error('Error retrieving access token:', error);
    }
}

async function getRandomArtist() {
    const genres = [

        "Pop", "Rock", "Hip-Hop", "R&B", "Country", "Jazz", "Classical",  "Reggae",
        "Alternative Rock", "Hard Rock", "Punk Rock",  "Heavy Metal",
        "Drill", "Techno", "Electro", "Americana", "Afrobeat", "K-Pop", "J-Pop", "Latin Pop", "Reggaeton"
    ];
    const selectedGenre = genres[Math.floor(Math.random() * genres.length)];
    let artist;

    do {
        const response = await fetch(`https://api.spotify.com/v1/search?q=genre:${selectedGenre}&type=artist&limit=10`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const data = await response.json();


        const eligibleArtists = data.artists.items.filter(a => a.followers.total > 800000);

        if (eligibleArtists.length > 0) {
            const randomIndex = Math.floor(Math.random() * eligibleArtists.length);
            artist = eligibleArtists[randomIndex];
        }

    } while (!artist);

    return artist;
}

async function getUniqueArtist() {
    let artist;
    do {
        artist = await getRandomArtist();
    } while (comparedArtists.some(a => a.id === artist.id));

    comparedArtists.push(artist);
    return artist;
}

function displayArtist(artist, artistNumber) {
    const artistImageElement = document.getElementById(`artist${artistNumber}-image`);
    const artistNameElement = document.getElementById(`artist${artistNumber}-name`);
    const artistFollowersElement = document.getElementById(`artist${artistNumber}-followers`);

    artistImageElement.src = artist.images[0]?.url || '';
    artistNameElement.textContent = artist.name;


    artistFollowersElement.textContent = `Followers: ${artist.followers.total.toLocaleString()}`;


    if (artistNumber === 1) {
        artistFollowersElement.style.opacity = '1';
        artistFollowersElement.style.display = 'block';
    } else if (artistNumber === 2) {
        artistFollowersElement.classList.add('right');
        artistFollowersElement.style.display = 'none';
    }
}

function updateScoreDisplay() {
    document.getElementById('score').textContent = `Score: ${score}`;
    document.getElementById('high-score').textContent = `High score: ${highScore}`;
}

async function handleGuess(isHigher) {
    const previousArtist = currentArtist;
    currentArtist = newArtist;
    newArtist = await getUniqueArtist();

    let correct = false;

    if (isHigher) {
        correct = currentArtist.followers.total > previousArtist.followers.total;
    } else {
        correct = currentArtist.followers.total < previousArtist.followers.total;
    }

    const resultMessage = document.getElementById('result-message');
    if (correct) {
        resultMessage.textContent = "Correct!";
        score++;
        if (score > highScore) {
            highScore = score;
        }
    } else {
        resultMessage.textContent = "Wrong!";
        score = 0;
    }

    updateScoreDisplay();

    const rightFollowersElement = document.getElementById('artist2-followers');
    rightFollowersElement.style.display = 'block';
    rightFollowersElement.classList.add('show');


    await new Promise(resolve => setTimeout(resolve, 300));


    displayArtist(currentArtist, 1);
    displayArtist(newArtist, 2);

    rightFollowersElement.classList.remove('show');
    rightFollowersElement.style.display = 'none';
}

startGame();
