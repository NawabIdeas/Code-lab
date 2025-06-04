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

// Redirect to login if not admin
auth.onAuthStateChanged(user => {
    if (!user || user.email !== 'admin@appname.com') {
        window.location.href = 'index.html';
    } else {
        loadCategories();
        loadOrders();
        loadUsers();
        loadPaymentMethods();
        loadProducts();
    }
});

function logout() {
    auth.signOut().then(() => window.location.href = 'index.html');
}

function loadCategories() {
    const categoryList = document.getElementById('category-list');
    const productCategorySelect = document.getElementById('product-category');
    categoryList.innerHTML = '';
    productCategorySelect.innerHTML = '<option value="">Select Category</option>';
    db.collection('categories').orderBy('name').get().then(snapshot => {
        snapshot.forEach(doc => {
            const category = doc.data();
            const div = document.createElement('div');
            div.className = 'category-item';
            div.innerHTML = `
                <p>${category.name}</p>
                <button class="btn-3d" onclick="deleteCategory('${doc.id}')">Delete</button>
            `;
            categoryList.appendChild(div);
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.name;
            productCategorySelect.appendChild(option);
        });
    });
}

function addCategory() {
    const categoryName = document.getElementById('category-name').value;
    if (categoryName) {
        db.collection('categories').add({
            name: categoryName
        }).then(() => {
            document.getElementById('category-name').value = '';
            loadCategories();
        });
    } else {
        alert('Please enter a category name.');
    }
}

function deleteCategory(categoryId) {
    db.collection('categories').doc(categoryId).delete().then(() => loadCategories());
}

function loadOrders() {
    const orderList = document.getElementById('order-list');
    db.collection('orders').orderBy('createdAt', 'desc').get().then(snapshot => {
        orderList.innerHTML = '';
        snapshot.forEach(doc => {
            const order = doc.data();
            db.collection('users').doc(order.userId).get().then(userDoc => {
                const user = userDoc.data();
                const div = document.createElement('div');
                div.className = 'order-item';
                div.innerHTML = `
                    <div>
                        <p>Product: ${order.productTitle}</p>
                        <p>User: ${user.name} (${user.email})</p>
                        <p>WhatsApp: ${order.whatsapp}</p>
                        <p>Payment Method: ${order.paymentMethod}</p>
                        <p>Status: ${order.status}</p>
                        <img src="${order.screenshot}" alt="Screenshot" style="max-width: 100px; cursor: pointer;" onclick="window.open('${order.screenshot}')">
                    </div>
                    <div>
                        <button class="btn-3d" onclick="updateOrderStatus('${doc.id}', 'Approved')">Approve</button>
                        <button class="btn-3d" onclick="updateOrderStatus('${doc.id}', 'Rejected')">Reject</button>
                    </div>
                `;
                orderList.appendChild(div);
            });
        });
    });
}

function updateOrderStatus(orderId, status) {
    db.collection('orders').doc(orderId).update({ status: status })
        .then(() => loadOrders());
}

function loadUsers() {
    const userList = document.getElementById('user-list');
    db.collection('users').get().then(snapshot => {
        userList.innerHTML = '';
        snapshot.forEach(doc => {
            const user = doc.data();
            const div = document.createElement('div');
            div.className = 'user-item';
            div.innerHTML = `
                <div>
                    <p>Name: ${user.name}</p>
                    <p>Email: ${user.email}</p>
                </div>
                <button class="btn-3d" onclick="deleteUser('${doc.id}')">Remove</button>
            `;
            userList.appendChild(div);
        });
    });
}

function deleteUser(userId) {
    db.collection('users').doc(userId).delete().then(() => loadUsers());
}

function loadPaymentMethods() {
    const paymentList = document.getElementById('payment-list');
    db.collection('paymentMethods').get().then(snapshot => {
        paymentList.innerHTML = '';
        snapshot.forEach(doc => {
            const payment = doc.data();
            const div = document.createElement('div');
            div.className = 'payment-item';
            div.innerHTML = `
                <div>
                    <p>Name: ${payment.name}</p>
                    <p>Account: ${payment.accountName} - ${payment.accountNumber}</p>
                </div>
                <button class="btn-3d" onclick="deletePaymentMethod('${doc.id}')">Delete</button>
            `;
            paymentList.appendChild(div);
        });
    });
}

function addPaymentMethod() {
    const name = document.getElementById('payment-name').value;
    const accountName = document.getElementById('account-name').value;
    const accountNumber = document.getElementById('account-number').value;
    if (!name || !accountName || !accountNumber) {
        alert('Please fill all payment method fields.');
        return;
    }
    db.collection('paymentMethods').add({
        name: name,
        accountName: accountName,
        accountNumber: accountNumber
    }).then(() => {
        loadPaymentMethods();
        document.getElementById('payment-name').value = '';
        document.getElementById('account-name').value = '';
        document.getElementById('account-number').value = '';
    });
}

function deletePaymentMethod(paymentId) {
    db.collection('paymentMethods').doc(paymentId).delete().then(() => loadPaymentMethods());
}

function addProduct() {
    const title = document.getElementById('product-title').value;
    const description = document.getElementById('product-description').value;
    const pricePKR = document.getElementById('product-price-pkr').value;
    const priceCrypto = document.getElementById('product-price-crypto').value;
    const category = document.getElementById('product-category').value;
    const demoURL = document.getElementById('demo-url').value;
    const buyButton = document.getElementById('buy-button').checked;
    const image = document.getElementById('product-image').files[0];

    if (!title || !pricePKR || !category) {
        alert('Please fill all required fields.');
        return;
    }

    if (!image) {
        db.collection('products').add({
            title: title,
            description: description,
            pricePKR: pricePKR,
            priceCrypto: priceCrypto || '',
            category: category,
            demoURL: demoURL,
            buyButton: buyButton,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            loadProducts();
            clearProductForm();
        });
        return;
    }

    const storageRef = storage.ref(`products/${Date.now()}`);
    storageRef.put(image).then(snapshot => {
        snapshot.ref.getDownloadURL().then(url => {
            db.collection('products').add({
                title: title,
                description: description,
                pricePKR: pricePKR,
                priceCrypto: priceCrypto || '',
                category: category,
                image: url,
                demoURL: demoURL,
                buyButton: buyButton,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                loadProducts();
                clearProductForm();
            });
        });
    });
}

function clearProductForm() {
    document.getElementById('product-title').value = '';
    document.getElementById('product-description').value = '';
    document.getElementById('product-price-pkr').value = '';
    document.getElementById('product-price-crypto').value = '';
    document.getElementById('product-image').value = '';
    document.getElementById('demo-url').value = '';
    document.getElementById('buy-button').checked = true;
}

function loadProducts() {
    const productList = document.getElementById('admin-product-list');
    db.collection('products').orderBy('createdAt', 'desc').get().then(snapshot => {
        productList.innerHTML = '';
        snapshot.forEach(doc => {
            const product = doc.data();
            const div = document.createElement('div');
            div.className = 'product-item';
            div.innerHTML = `
                <div>
                    <p>Title: ${product.title}</p>
                    <p>Category: ${product.category}</p>
                    <p>Price: PKR ${product.pricePKR}${product.priceCrypto ? `, Crypto ${product.priceCrypto}` : ''}</p>
                    ${product.image ? `<img src="${product.image}" alt="${product.title}" style="max-width: 100px;">` : ''}
                </div>
                <button class="btn-3d" onclick="deleteProduct('${doc.id}')">Delete</button>
            `;
            productList.appendChild(div);
        });
    });
}

function deleteProduct(productId) {
    db.collection('products').doc(productId).delete().then(() => loadProducts());
}