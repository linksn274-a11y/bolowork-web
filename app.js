import { supabase } from './supabase.js';

// --- LOGIQUE STUDIO VOCAL (talent.html) ---
let isRecording = false;

window.startRecording = function() {
    isRecording = true;
    const micBtn = document.getElementById('mic-btn');
    const statusText = document.getElementById('status-text');
    if(micBtn) micBtn.classList.add('pulse-animation');
    if(statusText) {
        statusText.innerText = "🔴 Enregistrement... Relâche pour valider";
        statusText.classList.replace('text-gray-400', 'text-red-500');
    }
};

window.stopRecording = function() {
    if (!isRecording) return;
    isRecording = false;
    
    const micContainer = document.getElementById('mic-container');
    const statusText = document.getElementById('status-text');
    const processingUi = document.getElementById('processing-ui');
    const studioView = document.getElementById('studio-view');
    const profileView = document.getElementById('profile-view');

    if(micContainer) micContainer.classList.add('hidden');
    if(statusText) statusText.classList.add('hidden');
    if(processingUi) processingUi.classList.remove('hidden');

    // Simulation de l'appel API
    setTimeout(() => {
        if(studioView) studioView.classList.add('hidden');
        if(profileView) {
            profileView.classList.remove('hidden');
            profileView.classList.add('flex');
        }
    }, 3000);
};

window.cancelRecording = function() {
    if (isRecording) {
        isRecording = false;
        const micBtn = document.getElementById('mic-btn');
        const statusText = document.getElementById('status-text');
        if(micBtn) micBtn.classList.remove('pulse-animation');
        if(statusText) {
            statusText.innerText = "Maintiens enfoncé pour parler";
            statusText.classList.replace('text-red-500', 'text-gray-400');
        }
    }
};

// --- LOGIQUE DASHBOARD / RÉSEAU SOCIAL (dashboard.html) ---

window.toggleModal = function(modalID) {
    const modal = document.getElementById(modalID);
    if(modal) {
        modal.classList.toggle('hidden');
        modal.classList.toggle('modal-active');
    }
};

window.publishPost = async function() {
    const contentInput = document.getElementById('post-content');
    if(!contentInput) return;
    
    const content = contentInput.value;
    if(!content.trim()) return;

    // --- 1. SAUVEGARDE DANS SUPABASE ---
    console.log("Envoi du post à Supabase...");
    const { data, error } = await supabase
        .from('posts')
        .insert([
            { content: content, author_name: 'Utilisateur Test' }
        ]);

    if (error) {
        console.error("Erreur Supabase:", error);
        alert("Oups ! Impossible de sauvegarder. Avez-vous bien créé la table 'posts' et désactivé RLS (Row Level Security) sur Supabase ?");
        return; // On arrête là si la base de données refuse
    }

    // --- 2. AFFICHAGE IMMÉDIAT À L'ÉCRAN ---
    const newPostHTML = `
    <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-4 animate-pulse">
        <div class="p-5 flex items-center space-x-3">
            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600"><i class="fas fa-user"></i></div>
            <div>
                <h3 class="font-bold text-gray-800">Utilisateur Test</h3>
                <p class="text-xs text-gray-500">À l'instant</p>
            </div>
        </div>
        <div class="px-5 pb-4">
            <p class="text-gray-700">${content}</p>
        </div>
        <div class="px-5 py-3 flex justify-between border-t border-gray-100 text-gray-500 font-semibold text-sm">
            <button class="flex items-center space-x-2 hover:text-green-600"><i class="far fa-thumbs-up text-lg"></i> <span>J'aime</span></button>
            <button class="flex items-center space-x-2 hover:text-green-600"><i class="far fa-comment text-lg"></i> <span>Commenter</span></button>
            <button class="flex items-center space-x-2 hover:text-green-600"><i class="fas fa-share text-lg"></i> <span>Partager</span></button>
        </div>
    </div>`;

    const newPostsArea = document.getElementById('new-posts-area');
    if(newPostsArea) {
        newPostsArea.insertAdjacentHTML('afterbegin', newPostHTML);
    }
    
    // On vide la zone de texte et on ferme la modale
    contentInput.value = '';
    window.toggleModal('post-modal');

    setTimeout(() => {
        if(newPostsArea && newPostsArea.firstElementChild) {
            newPostsArea.firstElementChild.classList.remove('animate-pulse');
        }
    }, 1000);
    
    console.log("✅ Post publié et sauvegardé avec succès !");
};

// --- 3. LECTURE DE SUPABASE (Chargement des vrais posts) ---
window.loadPosts = async function() {
    const feedContainer = document.getElementById('new-posts-area');
    if(!feedContainer) return;
    
    // Requête vers Supabase (les plus récents en premier)
    const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Erreur de lecture Supabase:", error);
        feedContainer.innerHTML = '<p class="text-center text-red-500 py-4">Erreur de connexion à la base de données.</p>';
        return;
    }

    feedContainer.innerHTML = ''; // On vide le message de chargement

    if (posts.length === 0) {
        feedContainer.innerHTML = '<p class="text-center text-gray-500 py-4">Soyez le premier à publier un post !</p>';
        return;
    }

    // Afficher chaque post reçu de la base de données
    posts.forEach(post => {
        // Date formatée simplement
        const dateFr = new Date(post.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute:'2-digit' });

        const postHTML = `
        <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-4">
            <div class="p-5 flex items-center space-x-3">
                <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600"><i class="fas fa-user"></i></div>
                <div>
                    <h3 class="font-bold text-gray-800">${post.author_name}</h3>
                    <p class="text-xs text-gray-500">${dateFr}</p>
                </div>
            </div>
            <div class="px-5 pb-4">
                <p class="text-gray-700">${post.content}</p>
            </div>
            <div class="px-5 py-3 flex justify-between border-t border-gray-100 text-gray-500 font-semibold text-sm">
                <button class="flex items-center space-x-2 hover:text-green-600"><i class="far fa-thumbs-up text-lg"></i> <span>J'aime</span></button>
                <button class="flex items-center space-x-2 hover:text-green-600"><i class="far fa-comment text-lg"></i> <span>Commenter</span></button>
                <button class="flex items-center space-x-2 hover:text-green-600"><i class="fas fa-share text-lg"></i> <span>Partager</span></button>
            </div>
        </div>`;
        feedContainer.insertAdjacentHTML('beforeend', postHTML);
    });
};

// Exécution automatique : si on est sur la page du Dashboard, on charge les posts !
if (document.getElementById('new-posts-area')) {
    window.loadPosts();
}
