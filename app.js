import { supabase } from './supabase.js';

// --- AUTH GUARD (VÉRIFICATION DE CONNEXION) ---
supabase.auth.getSession().then(({ data: { session } }) => {
    // Si l'utilisateur n'est pas connecté et qu'il n'est pas déjà sur la page de login
    if (!session && !window.location.href.includes('login.html')) {
        window.location.href = 'login.html';
    }
});

// --- INITIALISATION DE L'IA VOCALE (Web Speech API) ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
    try {
        recognition = new SpeechRecognition();
        // Safari iOS gère très mal le "continuous = true", donc on l'adapte
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        recognition.continuous = !isIOS; 
        recognition.interimResults = true;
        recognition.lang = 'fr-FR';
    } catch(e) {
        console.error("Erreur micro:", e);
    }
}

// --- LOGIQUE DASHBOARD / RÉSEAU SOCIAL ---
window.toggleModal = function(modalID) {
    const modal = document.getElementById(modalID);
    if(modal) {
        modal.classList.toggle('hidden');
        modal.classList.toggle('modal-active');
    }
    // Si on ferme, on coupe le micro
    if(modal && modal.classList.contains('hidden') && recognition) {
        try { recognition.stop(); } catch(e){}
    }
};

window.startVoicePost = function() {
    if (!recognition) {
        alert("Désolé, Safari/iPhone bloque l'accès au micro natif sur cette page.");
        return;
    }
    
    // Ouvre la modale
    window.toggleModal('post-modal');
    const contentInput = document.getElementById('post-content');
    if(!contentInput) return;

    contentInput.placeholder = "🔴 Écoute en cours... Parlez !";
    contentInput.value = "";
    
    recognition.onresult = (event) => {
        let localTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            localTranscript += event.results[i][0].transcript;
        }
        contentInput.value = localTranscript;
        
        // Activer visuellement le bouton Publier
        const btn = document.getElementById('post-btn');
        if(btn) {
            btn.classList.replace('bg-gray-200', 'bg-green-600');
            btn.classList.replace('text-gray-400', 'text-white');
        }
    };

    recognition.onerror = (event) => {
        alert("Erreur du microphone : " + event.error);
    };
    
    try {
        recognition.start();
    } catch(e) {
        console.error(e);
    }
};

window.publishPost = async function() {
    if(recognition) {
        try { recognition.stop(); } catch(e){}
    }

    const contentInput = document.getElementById('post-content');
    if(!contentInput || !contentInput.value.trim()) return;
    
    const content = contentInput.value;
    const btn = document.getElementById('post-btn');
    if(btn) btn.innerText = "Envoi...";

    const { data: { session } } = await supabase.auth.getSession();
    const userName = session && session.user.email ? session.user.email.split('@')[0] : 'Utilisateur';

    const { data, error } = await supabase.from('posts').insert([
        { content: content, author_name: userName }
    ]);

    if (error) {
        alert("Erreur de sauvegarde : " + error.message);
        if(btn) btn.innerText = "Publier";
        return; 
    }

    contentInput.value = '';
    if(btn) btn.innerText = "Publier";
    window.toggleModal('post-modal');
    
    // Recharger la liste pour voir le nouveau post
    window.loadPosts();
};

window.loadPosts = async function() {
    const feedContainer = document.getElementById('new-posts-area');
    if(!feedContainer) return;
    
    try {
        const { data: posts, error } = await supabase
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            feedContainer.innerHTML = `<p class="text-center text-red-500 py-8">Erreur de connexion : ${error.message}</p>`;
            return;
        }

        feedContainer.innerHTML = ''; 

        // Gérer le cas où la base de données est vide !
        if (!posts || posts.length === 0) {
            feedContainer.innerHTML = `
            <div class="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
                <i class="fas fa-pen text-4xl mb-3 text-gray-300"></i>
                <p class="font-bold text-gray-800">Aucun post pour le moment</p>
                <p class="text-sm mt-1">Soyez le premier à publier quelque chose !</p>
            </div>`;
            return;
        }

        posts.forEach(post => {
            const dateFr = new Date(post.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute:'2-digit' });
            const postHTML = `
            <div class="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
                <div class="p-4 flex items-start space-x-3">
                    <div class="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-xl shrink-0"><i class="fas fa-user-circle"></i></div>
                    <div class="flex-grow">
                        <h3 class="font-bold text-gray-900 text-sm">${post.author_name}</h3>
                        <p class="text-xs text-gray-500">Membre du réseau</p>
                        <p class="text-[10px] text-gray-400 mt-0.5">${dateFr}</p>
                    </div>
                </div>
                <div class="px-4 pb-4">
                    <p class="text-gray-800 text-sm">${post.content}</p>
                </div>
                <div class="px-4 py-2 border-t border-gray-200 flex justify-between">
                    <button class="flex items-center space-x-2 text-gray-500 hover:bg-gray-100 rounded-md px-3 py-2 transition font-semibold text-sm">
                        <i class="far fa-thumbs-up text-lg"></i> <span class="hidden sm:inline">J'aime</span>
                    </button>
                    <button class="flex items-center space-x-2 text-gray-500 hover:bg-gray-100 rounded-md px-3 py-2 transition font-semibold text-sm">
                        <i class="far fa-comment text-lg"></i> <span class="hidden sm:inline">Commenter</span>
                    </button>
                </div>
            </div>`;
            feedContainer.insertAdjacentHTML('beforeend', postHTML);
        });
    } catch (e) {
        feedContainer.innerHTML = `<p class="text-center text-red-500 py-8">Erreur d'affichage : ${e.message}</p>`;
    }
};

// Exécution automatique
if (document.getElementById('new-posts-area')) {
    window.loadPosts();
}

// --- DÉCONNEXION ---
window.logout = async function() {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
};

// Chargement du mini-profil s'il existe sur la page courante
document.addEventListener('DOMContentLoaded', () => {
    const data = JSON.parse(localStorage.getItem('bolowork_profile'));
    if (data && document.getElementById('mini-name')) {
        document.getElementById('mini-name').innerText = data.name || 'Utilisateur';
        document.getElementById('mini-headline').innerText = data.headline || '';
        
        if (data.avatar && document.getElementById('mini-avatar')) {
            document.getElementById('mini-avatar').src = data.avatar;
        }
        if (data.cover && document.getElementById('mini-cover')) {
            document.getElementById('mini-cover').style.backgroundImage = `url('${data.cover}')`;
            document.getElementById('mini-cover').style.backgroundSize = 'cover';
            document.getElementById('mini-cover').style.backgroundPosition = 'center';
        }
    }
});

// Ajout d'un bouton de déconnexion flottant
function injectLogout() {
    if (document.getElementById('logout-btn-global')) return;
    const btn = document.createElement('button');
    btn.id = 'logout-btn-global';
    btn.onclick = window.logout;
    btn.className = 'fixed top-2 right-4 text-gray-500 hover:text-red-600 transition z-[100] bg-white p-2 rounded-full shadow border border-gray-200';
    btn.innerHTML = '<i class="fas fa-power-off text-xl"></i>';
    btn.title = "Se déconnecter";
    document.body.appendChild(btn);
}

if (document.body) {
    injectLogout();
} else {
    document.addEventListener('DOMContentLoaded', injectLogout);
}
