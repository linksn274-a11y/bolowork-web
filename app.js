import { supabase } from './supabase.js';

// --- INITIALISATION DE L'IA VOCALE (Web Speech API) ---
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'fr-FR'; // Langue par défaut
}

// --- 1. LOGIQUE STUDIO VOCAL (Page Talent) ---
let isRecording = false;
let finalTranscript = '';

window.startRecording = function() {
    if (!recognition) {
        alert("Désolé, votre navigateur ne supporte pas la reconnaissance vocale native.");
        return;
    }

    isRecording = true;
    finalTranscript = '';
    
    const micBtn = document.getElementById('mic-btn');
    const statusText = document.getElementById('status-text');
    
    if(micBtn) micBtn.classList.add('pulse-animation');
    if(statusText) {
        statusText.innerText = "🗣️ Je vous écoute...";
        statusText.classList.replace('text-gray-400', 'text-red-500');
    }

    // Capture de la voix en temps réel
    recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        // Afficher ce que la personne dit en temps réel !
        if(statusText) statusText.innerText = interimTranscript || finalTranscript || "🗣️ Je vous écoute...";
    };

    recognition.start();
};

window.stopRecording = async function() {
    if (!isRecording) return;
    isRecording = false;
    if (recognition) recognition.stop();
    
    const micContainer = document.getElementById('mic-container');
    const statusText = document.getElementById('status-text');
    const processingUi = document.getElementById('processing-ui');
    const studioView = document.getElementById('studio-view');
    const profileView = document.getElementById('profile-view');

    if(micContainer) micContainer.classList.add('hidden');
    if(statusText) statusText.classList.add('hidden');
    if(processingUi) processingUi.classList.remove('hidden');

    console.log("Texte capturé :", finalTranscript);

    // 1. Sauvegarde du Profil dans Supabase
    // (Dans une vraie app complexe, on enverrait `finalTranscript` à ChatGPT ici pour le formater. 
    // Pour le MVP, on sauvegarde la retranscription directe comme "Bio").
    const { data, error } = await supabase.from('profiles').insert([{
        full_name: "Nouveau Talent",
        job_title: "Artisan indépendant",
        location: "Dakar",
        bio: finalTranscript || "Profil généré automatiquement par la voix."
    }]);

    if (error) console.error("Erreur sauvegarde profil:", error);

    // 2. Affichage visuel du profil généré
    setTimeout(() => {
        if(studioView) studioView.classList.add('hidden');
        if(profileView) {
            // Mettre à jour le texte du profil avec ce qui a été dit
            const bioElement = document.getElementById('profile-bio');
            if(bioElement && finalTranscript) {
                bioElement.innerText = '"' + finalTranscript + '"';
            }
            profileView.classList.remove('hidden');
            profileView.classList.add('flex');
        }
    }, 2000);
};

window.cancelRecording = function() {
    if (isRecording) {
        isRecording = false;
        if(recognition) recognition.stop();
        const micBtn = document.getElementById('mic-btn');
        const statusText = document.getElementById('status-text');
        if(micBtn) micBtn.classList.remove('pulse-animation');
        if(statusText) {
            statusText.innerText = "Maintiens enfoncé pour parler";
            statusText.classList.replace('text-red-500', 'text-gray-400');
        }
    }
};

// --- 2. LOGIQUE DASHBOARD / RÉSEAU SOCIAL ---

window.toggleModal = function(modalID) {
    const modal = document.getElementById(modalID);
    if(modal) {
        modal.classList.toggle('hidden');
        modal.classList.toggle('modal-active');
    }
    // Si on ferme la modale, on arrête le micro au cas où
    if(modal && modal.classList.contains('hidden') && recognition) {
        recognition.stop();
    }
};

// Nouvelle fonction : Créer un post avec la voix
window.startVoicePost = function() {
    if (!recognition) {
        alert("La reconnaissance vocale n'est pas supportée sur ce navigateur.");
        return;
    }
    
    // Ouvre la modale
    window.toggleModal('post-modal');
    const contentInput = document.getElementById('post-content');
    contentInput.placeholder = "🔴 Écoute en cours... Parlez maintenant !";
    contentInput.value = "";
    
    let localTranscript = '';
    
    recognition.onresult = (event) => {
        localTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            localTranscript += event.results[i][0].transcript;
        }
        // Remplir la zone de texte magiquement pendant que l'utilisateur parle
        contentInput.value = localTranscript;
    };
    
    recognition.start();
};

window.publishPost = async function() {
    // On arrête le micro si on était en train de dicter
    if(recognition) recognition.stop();

    const contentInput = document.getElementById('post-content');
    if(!contentInput) return;
    
    const content = contentInput.value;
    if(!content.trim()) return;

    console.log("Envoi du post à Supabase...");
    const { data, error } = await supabase.from('posts').insert([
        { content: content, author_name: 'Talent BoloWork' }
    ]);

    if (error) {
        console.error("Erreur Supabase:", error);
        alert("Impossible de sauvegarder. Vérifiez Supabase.");
        return; 
    }

    const newPostHTML = `
    <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-4 animate-pulse">
        <div class="p-5 flex items-center space-x-3">
            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600"><i class="fas fa-user"></i></div>
            <div>
                <h3 class="font-bold text-gray-800">Talent BoloWork</h3>
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
    if(newPostsArea) newPostsArea.insertAdjacentHTML('afterbegin', newPostHTML);
    
    contentInput.value = '';
    contentInput.placeholder = "De quoi voulez-vous parler ?";
    window.toggleModal('post-modal');

    setTimeout(() => {
        if(newPostsArea && newPostsArea.firstElementChild) {
            newPostsArea.firstElementChild.classList.remove('animate-pulse');
        }
    }, 1000);
};

window.loadPosts = async function() {
    const feedContainer = document.getElementById('new-posts-area');
    if(!feedContainer) return;
    
    const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return;
    feedContainer.innerHTML = ''; 
    if (posts.length === 0) return;

    posts.forEach(post => {
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

if (document.getElementById('new-posts-area')) {
    window.loadPosts();
}
