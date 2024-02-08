document.addEventListener('DOMContentLoaded', function() {
    fetch('https://script.google.com/macros/s/AKfycbxOaGYMw8UYe6N0yV-1BV_aaA8xchkJkMY55JxA9FSgadd1ZGoAqyykM93S_mHkD8Se/exec')
        .then(response => response.json())
        .then(data => {
            const filmGrid = document.getElementById('film-grid');

            data.forEach(film => {
                const filmElement = document.createElement('div');
                filmElement.classList.add('film');

                const posterImage = document.createElement('img');
                posterImage.src = film.posterlink;
                posterImage.alt = film.name;
                posterImage.classList.add('poster');
                filmElement.appendChild(posterImage);

                const overlay = document.createElement('div');
                overlay.classList.add('overlay');
                filmElement.appendChild(overlay);

                const title = document.createElement('p');
                title.textContent = film.name;
                title.classList.add('film-title');
                overlay.appendChild(title);

                const watchedInfo = document.createElement('p');
                watchedInfo.textContent = `Watched on: ${film.watchedon}`;
                watchedInfo.classList.add('watched-info');
                overlay.appendChild(watchedInfo);

                const ratingInfo = document.createElement('p');
                ratingInfo.textContent = `Rating: ${film.rating}`;
                ratingInfo.classList.add('rating-info');
                overlay.appendChild(ratingInfo);

                filmGrid.appendChild(filmElement);
            });
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
});
