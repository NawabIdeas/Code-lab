// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAe-ssCLGnjPwBtBHoWMLZhtzhRg7euoko",
  authDomain: "codelab-d73af.firebaseapp.com",
  databaseURL: "https://codelab-d73af-default-rtdb.firebaseio.com",
  projectId: "codelab-d73af",
  storageBucket: "codelab-d73af.firebasestorage.app",
  messagingSenderId: "77821476199",
  appId: "1:77821476199:web:a56387c237e1f77509c3c2",
  measurementId: "G-JMLB3Q0SH2"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

let selectedProduct = null;

// Login
function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    auth.signInWithEmailAndPassword(email, password)
        .then(() => window.location.href = 'dashboard.html')
        .catch(error => alert(error.message));
}

// Register
function register() {
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            return db.collection('users').doc(userCredential.user.uid).set({
                name: name,
                email: email
            });
        })
        .then(() => window.location.href = 'dashboard.html')
        .catch(error => alert(error.message));
}

// Logout
function logout() {
    auth.signOut().then(() => window.location.href = 'index.html');
}

// Toggle Menu
function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('active');
}

// Load Categories and Products
auth.onAuthStateChanged(user => {
    if (user && window.location.pathname.includes('dashboard.html')) {
        document.getElementById('user-name').textContent = user.displayName || 'User';
        loadCategories();
        loadProducts();
        loadPaymentMethods();
    } else if (!user && !window.location.pathname.includes('index.html') && !window.location.pathname.includes('register.html')) {
        window.location.href = 'index.html';
    }
});

function loadCategories() {
    const categories = ['Electronics', 'Clothing', 'Accessories'];
    const categoryList = document.getElementById('category-list');
    categoryList.innerHTML = '';
    categories.forEach(category => {
        const div = document.createElement('div');
        div.className = 'category-item';
        div.textContent = category;
        div.onclick = () => loadProducts(category);
        categoryList.appendChild(div);
    });
}

function loadProducts(category = null) {
    const productList = document.getElementById('product-list');
    productList.innerHTML = '';
    let query = db.collection('products').orderBy('createdAt', 'desc');
    if (category) query = query.where('category', '==', category);
    query.get().then(snapshot => {
        snapshot.forEach(doc => {
            const product = doc.data();
            const div = document.createElement('div');
            div.className = 'product-card';
            div.innerHTML = `
                <img src="${product.image}" alt="${product.title}">
                <h3>${product.title}</h3>
                <p>PKR ${product.pricePKR}</p>
                ${product.buyButton ? `<button onclick="openBuyModal('${doc.id}', '${product.title}', '${product.pricePKR}')">Buy</button>` : ''}
                ${product.demoURL ? `<button onclick="openDemoModal('${product.demoURL}')">Demo</button>` : ''}
            `;
            productList.appendChild(div);
        });
    });
}

function loadPaymentMethods() {
    const select = document.getElementById('payment-method');
    db.collection('paymentMethods').get().then(snapshot => {
        snapshot.forEach(doc => {
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = doc.data().name;
            select.appendChild(option);
        });
    });
}

function showPaymentDetails() {
    const paymentId = document.getElementById('payment-method').value;
    const paymentDetails = document.getElementById('payment-details');
    if (paymentId) {
        db.collection('paymentMethods').doc(paymentId).get().then(doc => {
            const data = doc.data();
            paymentDetails.innerHTML = `
                <p>Account Name: ${data.accountName}</p>
                <p>Account Number/Address: ${data.accountNumber} <button onclick="copyToClipboard('${data.accountNumber}')">Copy</button></p>
            `;
        });
    } else {
        paymentDetails.innerHTML = '';
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard!'));
}

function openBuyModal(productId, productTitle, productPrice) {
    selectedProduct = { id: productId, title: productTitle, price: productPrice };
    document.getElementById('buy-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('buy-modal').style.display = 'none';
}

function openDemoModal(url) {
    document.getElementById('demo-iframe').src = url;
    document.getElementById('demo-modal').style.display = 'flex';
}

function closeDemoModal() {
    document.getElementById('demo-modal').style.display = 'none';
    document.getElementById('demo-iframe').src = '';
}

function submitOrder() {
    const user = auth.currentUser;
    const whatsapp = document.getElementById('whatsapp-number').value;
    const paymentMethod = document.getElementById('payment-method').value;
    const screenshot = document.getElementById('payment-screenshot').files[0];
    if (!whatsapp || !paymentMethod || !screenshot) {
        alert('Please fill all fields and upload a screenshot.');
        return;
    }
    const storageRef = storage.ref(`screenshots/${user.uid}/${Date.now()}`);
    storageRef.put(screenshot).then(snapshot => {
        snapshot.ref.getDownloadURL().then(url => {
            db.collection('orders').add({
                userId: user.uid,
                productId: selectedProduct.id,
                productTitle: selectedProduct.title,
                price: selectedProduct.price,
                whatsapp: whatsapp,
                paymentMethod: paymentMethod,
                screenshot: url,
                status: 'Pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                alert('Order submitted for approval!');
                closeModal();
            });
        });
    });
}

// Load Status
if (window.location.pathname.includes('status.html')) {
    auth.onAuthStateChanged(user => {
        if (user) {
            db.collection('orders').where('userId', '==', user.uid).get().then(snapshot => {
                const statusList = document.getElementById('status-list');
                snapshot.forEach(doc => {
                    const order = doc.data();
                    const div = document.createElement('div');
                    div.className = 'order-item';
                    div.innerHTML = `
                        <p>Product: ${order.productTitle}</p>
                        <p>Price: PKR ${order.price}</p>
                        <p>Status: ${order.status}</p>
                    `;
                    statusList.appendChild(div);
                });
            });
        }
    });
}