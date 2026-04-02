/**
 * ==========================================================
 * HỆ THỐNG QUẢN LÝ KHO HÀNG — BACKEND (Code.gs)
 * ==========================================================
 * 
 * ⚠️ HƯỚNG DẪN: Thay YOUR_SPREADSHEET_ID bằng ID thật của Google Sheets
 * Lấy ID từ URL: https://docs.google.com/spreadsheets/d/[ID_Ở_ĐÂY]/edit
 */

// ============================================================
// CẤU HÌNH — THAY ĐỔI GIÁ TRỊ NÀY
// ============================================================
var SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID'; // ← THAY ID THẬT VÀO ĐÂY

// ============================================================
// HÀM CƠ BẢN — WEB APP SETUP
// ============================================================

/**
 * Hàm bắt buộc để deploy Web App
 * Khi người dùng mở URL → Google gọi hàm này → trả về trang HTML
 */
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Hệ thống Quản lý Kho hàng')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Server-side Include — Nhúng file CSS và JavaScript vào HTML
 * Dùng trong Index.html: <?!= include('CSS'); ?> và <?!= include('JavaScript'); ?>
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Helper: Mở spreadsheet và lấy sheet theo tên
 */
function getSheet(sheetName) {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
}

// ============================================================
// ĐĂNG NHẬP & PHÂN QUYỀN (RBAC)
// ============================================================

/**
 * Kiểm tra đăng nhập — Frontend gọi hàm này khi user submit form login
 * @param {string} email - Email người dùng nhập
 * @param {string} password - Mật khẩu người dùng nhập
 * @return {Object} Thông tin user hoặc lỗi
 */
function checkLogin(email, password) {
  try {
    var sheet = getSheet('Users');
    var data = sheet.getDataRange().getValues();
    
    // Duyệt từ dòng 2 (bỏ header)
    // Cột: User_ID(0), Email(1), Password(2), Full_Name(3), Role(4), Active(5)
    for (var i = 1; i < data.length; i++) {
      if (data[i][1].toString().trim().toLowerCase() === email.trim().toLowerCase()) {
        // Tìm thấy email → kiểm tra password
        if (data[i][2].toString() !== password) {
          return { success: false, error: 'WRONG_PASSWORD', message: 'Mật khẩu không đúng!' };
        }
        // Kiểm tra Active
        var isActive = (data[i][5] === true || data[i][5].toString().toUpperCase() === 'TRUE');
        if (!isActive) {
          return { success: false, error: 'INACTIVE', message: 'Tài khoản đã bị vô hiệu hóa. Liên hệ Admin.' };
        }
        // Đăng nhập thành công
        return {
          success: true,
          userId: data[i][0],
          email: data[i][1],
          fullName: data[i][3],
          role: data[i][4],
          active: true
        };
      }
    }
    
    // Không tìm thấy email
    return { success: false, error: 'NOT_FOUND', message: 'Email chưa được đăng ký trong hệ thống.' };
    
  } catch (e) {
    return { success: false, error: 'SYSTEM_ERROR', message: 'Lỗi hệ thống: ' + e.message };
  }
}

/**
 * Kiểm tra quyền trước khi thực hiện thao tác (Backend security)
 * Gọi hàm này ở đầu mỗi hàm CRUD cần bảo vệ
 * @param {string} userEmail - Email user đang thao tác (từ frontend gửi lên)
 * @param {Array} requiredRoles - Mảng các role được phép, vd: ['admin']
 * @return {Object} Thông tin user nếu hợp lệ
 * @throws {Error} Nếu không có quyền
 */
function checkPermission(userEmail, requiredRoles) {
  if (!userEmail) {
    throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
  }
  
  var sheet = getSheet('Users');
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][1].toString().trim().toLowerCase() === userEmail.trim().toLowerCase()) {
      var isActive = (data[i][5] === true || data[i][5].toString().toUpperCase() === 'TRUE');
      if (!isActive) {
        throw new Error('Tài khoản đã bị vô hiệu hóa.');
      }
      var role = data[i][4].toString();
      if (requiredRoles.indexOf(role) === -1) {
        throw new Error('Bạn không có quyền thực hiện thao tác này. Yêu cầu role: ' + requiredRoles.join(' hoặc '));
      }
      return { userId: data[i][0], email: data[i][1], fullName: data[i][3], role: role };
    }
  }
  
  throw new Error('Tài khoản không tồn tại trong hệ thống.');
}

// ============================================================
// DASHBOARD — TỔNG QUAN
// ============================================================

/**
 * Lấy dữ liệu tổng hợp cho Dashboard
 * @return {Object} Dữ liệu dashboard (cards, charts)
 */
function getDashboardData() {
  try {
    var productsSheet = getSheet('Products');
    var transSheet = getSheet('Transactions');
    var catSheet = getSheet('Categories');
    
    var products = productsSheet.getDataRange().getValues();
    var transactions = transSheet.getDataRange().getValues();
    var categories = catSheet.getDataRange().getValues();
    
    // === 1. Tính tồn kho từng sản phẩm ===
    var stockMap = {}; // { productId: {nhap: X, xuat: Y} }
    for (var t = 1; t < transactions.length; t++) {
      var pId = transactions[t][1].toString();
      var type = transactions[t][2].toString();
      var qty = parseFloat(transactions[t][3]) || 0;
      
      if (!stockMap[pId]) stockMap[pId] = { nhap: 0, xuat: 0 };
      if (type === 'Nhập') stockMap[pId].nhap += qty;
      if (type === 'Xuất') stockMap[pId].xuat += qty;
    }
    
    // === 2. Tính Summary Cards ===
    var totalProducts = products.length - 1; // trừ header
    var lowStockCount = 0;
    var totalValue = 0;
    var productStocks = []; // để tính top 5
    
    // Map categories
    var catMap = {};
    for (var c = 1; c < categories.length; c++) {
      catMap[categories[c][0]] = categories[c][1];
    }
    
    // Tính tồn kho theo danh mục cho Pie Chart
    var catStockValue = {}; // { catName: totalValue }
    
    for (var p = 1; p < products.length; p++) {
      var productId = products[p][0].toString();
      var productName = products[p][1];
      var catId = products[p][2].toString();
      var unitPrice = parseFloat(products[p][5]) || 0;
      var minStock = parseFloat(products[p][6]) || 0;
      
      var stock = 0;
      if (stockMap[productId]) {
        stock = stockMap[productId].nhap - stockMap[productId].xuat;
      }
      
      // Tổng giá trị tồn kho
      totalValue += stock * unitPrice;
      
      // Sản phẩm sắp hết
      if (stock <= minStock) lowStockCount++;
      
      // Top 5 tồn kho
      productStocks.push({ name: productName, stock: stock });
      
      // Pie chart theo danh mục
      var catName = catMap[catId] || 'Không xác định';
      if (!catStockValue[catName]) catStockValue[catName] = 0;
      catStockValue[catName] += stock * unitPrice;
    }
    
    // === 3. Giao dịch tháng này ===
    var now = new Date();
    var thisMonth = now.getMonth();
    var thisYear = now.getFullYear();
    var monthlyTransactions = 0;
    
    for (var t2 = 1; t2 < transactions.length; t2++) {
      var transDate = new Date(transactions[t2][7]);
      if (transDate.getMonth() === thisMonth && transDate.getFullYear() === thisYear) {
        monthlyTransactions++;
      }
    }
    
    // === 4. Pie Chart data ===
    var pieData = [['Danh mục', 'Giá trị tồn kho']];
    for (var catName in catStockValue) {
      pieData.push([catName, catStockValue[catName]]);
    }
    
    // === 5. Bar Chart — Top 5 tồn kho nhiều nhất ===
    productStocks.sort(function(a, b) { return b.stock - a.stock; });
    var barData = [['Sản phẩm', 'Tồn kho', { role: 'style' }]];
    var colors = ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#9C27B0'];
    for (var i = 0; i < Math.min(5, productStocks.length); i++) {
      barData.push([productStocks[i].name, productStocks[i].stock, colors[i]]);
    }
    
    return {
      success: true,
      totalProducts: totalProducts,
      monthlyTransactions: monthlyTransactions,
      lowStockCount: lowStockCount,
      totalValue: totalValue,
      pieData: pieData,
      barData: barData
    };
    
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ============================================================
// CATEGORIES — DANH MỤC
// ============================================================

/**
 * Lấy danh sách danh mục
 */
function getCategories() {
  try {
    var sheet = getSheet('Categories');
    var data = sheet.getDataRange().getValues();
    var result = [];
    for (var i = 1; i < data.length; i++) {
      result.push({
        catId: data[i][0],
        catName: data[i][1],
        description: data[i][2]
      });
    }
    return { success: true, data: result };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// ============================================================
// SUPPLIERS — NHÀ CUNG CẤP
// ============================================================

/**
 * Lấy danh sách nhà cung cấp
 */
function getSuppliers(userEmail) {
  try {
    var sheet = getSheet('Suppliers');
    var data = sheet.getDataRange().getValues();
    var result = [];
    for (var i = 1; i < data.length; i++) {
      result.push({
        supplierId: data[i][0],
        supplierName: data[i][1],
        contactPerson: data[i][2],
        phone: data[i][3],
        email: data[i][4],
        address: data[i][5]
      });
    }
    return { success: true, data: result };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Thêm nhà cung cấp mới — Chỉ admin
 */
function addSupplier(supplierData, userEmail) {
  checkPermission(userEmail, ['admin']);
  
  try {
    var sheet = getSheet('Suppliers');
    sheet.appendRow([
      supplierData.supplierId,
      supplierData.supplierName,
      supplierData.contactPerson,
      supplierData.phone,
      supplierData.email,
      supplierData.address
    ]);
    return { success: true, message: 'Thêm nhà cung cấp thành công!' };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Cập nhật nhà cung cấp — Chỉ admin
 */
function updateSupplier(supplierData, userEmail) {
  checkPermission(userEmail, ['admin']);
  
  try {
    var sheet = getSheet('Suppliers');
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === supplierData.supplierId) {
        sheet.getRange(i + 1, 2).setValue(supplierData.supplierName);
        sheet.getRange(i + 1, 3).setValue(supplierData.contactPerson);
        sheet.getRange(i + 1, 4).setValue(supplierData.phone);
        sheet.getRange(i + 1, 5).setValue(supplierData.email);
        sheet.getRange(i + 1, 6).setValue(supplierData.address);
        return { success: true, message: 'Cập nhật nhà cung cấp thành công!' };
      }
    }
    return { success: false, error: 'Không tìm thấy nhà cung cấp: ' + supplierData.supplierId };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Xóa nhà cung cấp — Chỉ admin
 */
function deleteSupplier(supplierId, userEmail) {
  checkPermission(userEmail, ['admin']);
  
  try {
    var sheet = getSheet('Suppliers');
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === supplierId) {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'Xóa nhà cung cấp thành công!' };
      }
    }
    return { success: false, error: 'Không tìm thấy nhà cung cấp: ' + supplierId };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Tạo mã nhà cung cấp mới tự động
 */
function generateSupplierId() {
  try {
    var sheet = getSheet('Suppliers');
    var data = sheet.getDataRange().getValues();
    var maxNum = 0;
    for (var i = 1; i < data.length; i++) {
      var id = data[i][0].toString();
      var num = parseInt(id.replace('SUP', ''));
      if (num > maxNum) maxNum = num;
    }
    var newNum = maxNum + 1;
    return 'SUP' + ('000' + newNum).slice(-3);
  } catch (e) {
    return 'SUP001';
  }
}

// ============================================================
// PRODUCTS — SẢN PHẨM
// ============================================================

/**
 * Lấy danh sách sản phẩm kèm tồn kho realtime
 */
function getProducts() {
  try {
    var productsSheet = getSheet('Products');
    var transSheet = getSheet('Transactions');
    var catSheet = getSheet('Categories');
    var supSheet = getSheet('Suppliers');
    
    var products = productsSheet.getDataRange().getValues();
    var transactions = transSheet.getDataRange().getValues();
    var categories = catSheet.getDataRange().getValues();
    var suppliers = supSheet.getDataRange().getValues();
    
    // Tạo map danh mục
    var catMap = {};
    for (var c = 1; c < categories.length; c++) {
      catMap[categories[c][0]] = categories[c][1];
    }
    
    // Tạo map nhà cung cấp
    var supMap = {};
    for (var s = 1; s < suppliers.length; s++) {
      supMap[suppliers[s][0]] = {
        name: suppliers[s][1],
        phone: suppliers[s][3]
      };
    }
    
    // Tính tồn kho từ Transactions
    var stockMap = {};
    for (var t = 1; t < transactions.length; t++) {
      var pId = transactions[t][1].toString();
      var type = transactions[t][2].toString();
      var qty = parseFloat(transactions[t][3]) || 0;
      
      if (!stockMap[pId]) stockMap[pId] = { nhap: 0, xuat: 0 };
      if (type === 'Nhập') stockMap[pId].nhap += qty;
      if (type === 'Xuất') stockMap[pId].xuat += qty;
    }
    
    // Build kết quả
    var result = [];
    for (var p = 1; p < products.length; p++) {
      var productId = products[p][0].toString();
      var minStock = parseFloat(products[p][6]) || 0;
      var currentStock = 0;
      
      if (stockMap[productId]) {
        currentStock = stockMap[productId].nhap - stockMap[productId].xuat;
      }
      
      // Xác định trạng thái
      var status = 'sufficient'; // Đủ hàng
      if (currentStock <= minStock) {
        status = 'critical'; // Hết hàng / dưới mức tối thiểu
      } else if (currentStock <= minStock * 1.5) {
        status = 'warning'; // Sắp hết
      }
      
      result.push({
        productId: productId,
        productName: products[p][1],
        catId: products[p][2],
        catName: catMap[products[p][2]] || 'N/A',
        supplierId: products[p][3],
        supplierName: supMap[products[p][3]] ? supMap[products[p][3]].name : 'N/A',
        unit: products[p][4],
        unitPrice: parseFloat(products[p][5]) || 0,
        minStock: minStock,
        currentStock: currentStock,
        status: status
      });
    }
    
    return { success: true, data: result };
    
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Thêm sản phẩm mới — Chỉ admin
 */
function addProduct(productData, userEmail) {
  checkPermission(userEmail, ['admin']);
  
  try {
    var sheet = getSheet('Products');
    sheet.appendRow([
      productData.productId,
      productData.productName,
      productData.catId,
      productData.supplierId,
      productData.unit,
      parseFloat(productData.unitPrice),
      parseFloat(productData.minStock)
    ]);
    return { success: true, message: 'Thêm sản phẩm thành công!' };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Cập nhật sản phẩm — Chỉ admin
 */
function updateProduct(productData, userEmail) {
  checkPermission(userEmail, ['admin']);
  
  try {
    var sheet = getSheet('Products');
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === productData.productId) {
        sheet.getRange(i + 1, 2).setValue(productData.productName);
        sheet.getRange(i + 1, 3).setValue(productData.catId);
        sheet.getRange(i + 1, 4).setValue(productData.supplierId);
        sheet.getRange(i + 1, 5).setValue(productData.unit);
        sheet.getRange(i + 1, 6).setValue(parseFloat(productData.unitPrice));
        sheet.getRange(i + 1, 7).setValue(parseFloat(productData.minStock));
        return { success: true, message: 'Cập nhật sản phẩm thành công!' };
      }
    }
    return { success: false, error: 'Không tìm thấy sản phẩm: ' + productData.productId };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Xóa sản phẩm — Chỉ admin
 */
function deleteProduct(productId, userEmail) {
  checkPermission(userEmail, ['admin']);
  
  try {
    var sheet = getSheet('Products');
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === productId) {
        sheet.deleteRow(i + 1);
        return { success: true, message: 'Xóa sản phẩm thành công!' };
      }
    }
    return { success: false, error: 'Không tìm thấy sản phẩm: ' + productId };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Tạo mã sản phẩm mới tự động
 */
function generateProductId() {
  try {
    var sheet = getSheet('Products');
    var data = sheet.getDataRange().getValues();
    var maxNum = 0;
    for (var i = 1; i < data.length; i++) {
      var id = data[i][0].toString();
      var num = parseInt(id.replace('SP', ''));
      if (num > maxNum) maxNum = num;
    }
    var newNum = maxNum + 1;
    return 'SP' + ('000' + newNum).slice(-3);
  } catch (e) {
    return 'SP001';
  }
}

// ============================================================
// TRANSACTIONS — NHẬP / XUẤT KHO
// ============================================================

/**
 * Lấy danh sách giao dịch (20 gần nhất)
 */
function getTransactions() {
  try {
    var transSheet = getSheet('Transactions');
    var productsSheet = getSheet('Products');
    var supSheet = getSheet('Suppliers');
    
    var transactions = transSheet.getDataRange().getValues();
    var products = productsSheet.getDataRange().getValues();
    var suppliers = supSheet.getDataRange().getValues();
    
    // Map sản phẩm
    var prodMap = {};
    for (var p = 1; p < products.length; p++) {
      prodMap[products[p][0]] = products[p][1];
    }
    
    // Map nhà cung cấp
    var supMap = {};
    for (var s = 1; s < suppliers.length; s++) {
      supMap[suppliers[s][0]] = suppliers[s][1];
    }
    
    var result = [];
    for (var i = 1; i < transactions.length; i++) {
      result.push({
        transId: transactions[i][0],
        productId: transactions[i][1],
        productName: prodMap[transactions[i][1]] || 'N/A',
        type: transactions[i][2],
        quantity: parseFloat(transactions[i][3]) || 0,
        supplierId: transactions[i][4],
        supplierName: supMap[transactions[i][4]] || '',
        note: transactions[i][5],
        createdBy: transactions[i][6],
        createdAt: transactions[i][7] ? Utilities.formatDate(new Date(transactions[i][7]), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm') : ''
      });
    }
    
    // Sắp xếp mới nhất lên đầu và lấy 20 dòng
    result.reverse();
    result = result.slice(0, 20);
    
    return { success: true, data: result };
    
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Tạo phiếu nhập/xuất kho — admin + warehouse_staff
 */
function createTransaction(transData, userEmail) {
  var user = checkPermission(userEmail, ['admin', 'warehouse_staff']);
  
  try {
    // Validate số lượng
    var quantity = parseFloat(transData.quantity);
    if (!quantity || quantity <= 0) {
      return { success: false, error: 'Số lượng phải lớn hơn 0!' };
    }
    
    // Nếu Xuất → kiểm tra tồn kho
    if (transData.type === 'Xuất') {
      var currentStock = calculateStock(transData.productId);
      if (currentStock < quantity) {
        return { 
          success: false, 
          error: 'Tồn kho chỉ còn ' + currentStock + ', không thể xuất ' + quantity + '!' 
        };
      }
    }
    
    // Tạo Trans_ID tự động: TXN + YYYYMMDD + XXX
    var transId = generateTransId();
    
    // Ghi vào sheet
    var sheet = getSheet('Transactions');
    var now = new Date();
    sheet.appendRow([
      transId,
      transData.productId,
      transData.type,
      quantity,
      transData.type === 'Nhập' ? transData.supplierId : '',
      transData.note || '',
      user.fullName,
      now
    ]);
    
    // Kiểm tra sau khi xuất: nếu tồn kho ≤ Min_Stock → tự động gửi email cảnh báo
    if (transData.type === 'Xuất') {
      var newStock = calculateStock(transData.productId);
      var minStock = getMinStock(transData.productId);
      
      if (newStock <= minStock) {
        // Gửi email cảnh báo tự động
        sendAutoAlert(transData.productId, newStock);
      }
    }
    
    return { success: true, message: 'Tạo phiếu ' + transData.type + ' kho thành công! Mã: ' + transId };
    
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Tính tồn kho hiện tại của 1 sản phẩm
 */
function calculateStock(productId) {
  var sheet = getSheet('Transactions');
  var data = sheet.getDataRange().getValues();
  var nhap = 0, xuat = 0;
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][1].toString() === productId) {
      var qty = parseFloat(data[i][3]) || 0;
      if (data[i][2].toString() === 'Nhập') nhap += qty;
      if (data[i][2].toString() === 'Xuất') xuat += qty;
    }
  }
  
  return nhap - xuat;
}

/**
 * Lấy Min_Stock của sản phẩm
 */
function getMinStock(productId) {
  var sheet = getSheet('Products');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toString() === productId) {
      return parseFloat(data[i][6]) || 0;
    }
  }
  return 0;
}

/**
 * Tạo mã giao dịch tự động: TXN + YYYYMMDD + XXX
 */
function generateTransId() {
  var sheet = getSheet('Transactions');
  var data = sheet.getDataRange().getValues();
  var now = new Date();
  var dateStr = Utilities.formatDate(now, 'Asia/Ho_Chi_Minh', 'yyyyMMdd');
  var prefix = 'TXN' + dateStr;
  
  var maxNum = 0;
  for (var i = 1; i < data.length; i++) {
    var id = data[i][0].toString();
    if (id.indexOf(prefix) === 0) {
      var num = parseInt(id.substring(prefix.length));
      if (num > maxNum) maxNum = num;
    }
  }
  
  var newNum = maxNum + 1;
  return prefix + ('000' + newNum).slice(-3);
}

// ============================================================
// CẢNH BÁO TỒN KHO & EMAIL
// ============================================================

/**
 * Lấy danh sách sản phẩm sắp hết hàng (tồn kho ≤ Min_Stock)
 */
function getStockAlerts() {
  try {
    var productsResult = getProducts();
    if (!productsResult.success) return productsResult;
    
    var supSheet = getSheet('Suppliers');
    var suppliers = supSheet.getDataRange().getValues();
    var supMap = {};
    for (var s = 1; s < suppliers.length; s++) {
      supMap[suppliers[s][0]] = {
        name: suppliers[s][1],
        phone: suppliers[s][3]
      };
    }
    
    var alerts = [];
    for (var i = 0; i < productsResult.data.length; i++) {
      var product = productsResult.data[i];
      if (product.currentStock <= product.minStock) {
        var sup = supMap[product.supplierId] || { name: 'N/A', phone: 'N/A' };
        alerts.push({
          productId: product.productId,
          productName: product.productName,
          catName: product.catName,
          currentStock: product.currentStock,
          minStock: product.minStock,
          unit: product.unit,
          supplierName: sup.name,
          supplierPhone: sup.phone
        });
      }
    }
    
    return { success: true, data: alerts };
    
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Gửi email cảnh báo thủ công (nút "Gửi cảnh báo ngay") — admin
 */
function sendManualAlertEmails(userEmail) {
  checkPermission(userEmail, ['admin']);
  
  try {
    var alertsResult = getStockAlerts();
    if (!alertsResult.success || alertsResult.data.length === 0) {
      return { success: false, error: 'Không có sản phẩm nào cần cảnh báo.' };
    }
    
    // Lấy danh sách email nhận
    var recipientSheet = getSheet('AlertRecipients');
    var recipientData = recipientSheet.getDataRange().getValues();
    var recipients = [];
    for (var r = 1; r < recipientData.length; r++) {
      var isActive = (recipientData[r][2] === true || recipientData[r][2].toString().toUpperCase() === 'TRUE');
      if (isActive) {
        recipients.push(recipientData[r][0]);
      }
    }
    
    if (recipients.length === 0) {
      return { success: false, error: 'Không có người nhận nào đang Active.' };
    }
    
    // Soạn email
    var subject = '⚠️ CẢNH BÁO TỒN KHO THẤP — Hệ thống Quản lý Kho';
    var body = '⚠️ CẢNH BÁO TỒN KHO THẤP\n\n';
    body += 'Các sản phẩm sau đang ở mức tồn kho thấp:\n';
    body += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
    
    for (var i = 0; i < alertsResult.data.length; i++) {
      var item = alertsResult.data[i];
      body += 'Sản phẩm: ' + item.productName + ' (Mã: ' + item.productId + ')\n';
      body += 'Danh mục: ' + item.catName + '\n';
      body += 'Tồn kho hiện tại: ' + item.currentStock + ' ' + item.unit + '\n';
      body += 'Mức tối thiểu: ' + item.minStock + ' ' + item.unit + '\n';
      body += 'Nhà cung cấp: ' + item.supplierName + ' - SĐT: ' + item.supplierPhone + '\n';
      body += '\nVui lòng liên hệ nhà cung cấp để đặt hàng bổ sung!\n';
      body += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
    }
    
    body += '---\nHệ thống Quản lý Kho — Thông báo tự động\n';
    body += 'Thời gian: ' + Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss');
    
    // Gửi email
    GmailApp.sendEmail(recipients.join(','), subject, body);
    
    return { success: true, message: 'Đã gửi cảnh báo đến ' + recipients.length + ' người nhận!' };
    
  } catch (e) {
    return { success: false, error: 'Lỗi gửi email: ' + e.message };
  }
}

/**
 * Gửi email cảnh báo tự động khi xuất kho (1 sản phẩm cụ thể)
 */
function sendAutoAlert(productId, currentStock) {
  try {
    var productsSheet = getSheet('Products');
    var catSheet = getSheet('Categories');
    var supSheet = getSheet('Suppliers');
    var recipientSheet = getSheet('AlertRecipients');
    
    var products = productsSheet.getDataRange().getValues();
    var categories = catSheet.getDataRange().getValues();
    var suppliers = supSheet.getDataRange().getValues();
    var recipientData = recipientSheet.getDataRange().getValues();
    
    // Tìm sản phẩm
    var product = null;
    for (var p = 1; p < products.length; p++) {
      if (products[p][0].toString() === productId) {
        product = products[p];
        break;
      }
    }
    if (!product) return;
    
    // Tìm tên danh mục
    var catName = '';
    for (var c = 1; c < categories.length; c++) {
      if (categories[c][0].toString() === product[2].toString()) {
        catName = categories[c][1];
        break;
      }
    }
    
    // Tìm NCC
    var supName = '', supPhone = '';
    for (var s = 1; s < suppliers.length; s++) {
      if (suppliers[s][0].toString() === product[3].toString()) {
        supName = suppliers[s][1];
        supPhone = suppliers[s][3];
        break;
      }
    }
    
    // Lấy recipients
    var recipients = [];
    for (var r = 1; r < recipientData.length; r++) {
      var isActive = (recipientData[r][2] === true || recipientData[r][2].toString().toUpperCase() === 'TRUE');
      if (isActive) recipients.push(recipientData[r][0]);
    }
    
    if (recipients.length === 0) return;
    
    var subject = '⚠️ CẢNH BÁO: ' + product[1] + ' sắp hết hàng!';
    var body = '⚠️ CẢNH BÁO TỒN KHO THẤP\n\n';
    body += 'Sản phẩm: ' + product[1] + ' (Mã: ' + productId + ')\n';
    body += 'Danh mục: ' + catName + '\n';
    body += 'Tồn kho hiện tại: ' + currentStock + ' ' + product[4] + '\n';
    body += 'Mức tối thiểu: ' + product[6] + ' ' + product[4] + '\n';
    body += 'Nhà cung cấp: ' + supName + ' - SĐT: ' + supPhone + '\n';
    body += '\nVui lòng liên hệ nhà cung cấp để đặt hàng bổ sung!\n\n';
    body += '---\nHệ thống Quản lý Kho — Thông báo tự động\n';
    body += 'Thời gian: ' + Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm:ss');
    
    GmailApp.sendEmail(recipients.join(','), subject, body);
    
  } catch (e) {
    Logger.log('Lỗi gửi auto alert: ' + e.message);
  }
}

// ============================================================
// USERS — QUẢN LÝ NGƯỜI DÙNG
// ============================================================

/**
 * Lấy danh sách users — Chỉ admin
 */
function getUsers(userEmail) {
  checkPermission(userEmail, ['admin']);
  
  try {
    var sheet = getSheet('Users');
    var data = sheet.getDataRange().getValues();
    var result = [];
    
    // Cột: User_ID(0), Email(1), Password(2), Full_Name(3), Role(4), Active(5)
    for (var i = 1; i < data.length; i++) {
      result.push({
        userId: data[i][0],
        email: data[i][1],
        fullName: data[i][3],
        role: data[i][4],
        active: (data[i][5] === true || data[i][5].toString().toUpperCase() === 'TRUE')
      });
    }
    return { success: true, data: result };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Thêm user mới — Chỉ admin
 */
function addUser(userData, userEmail) {
  checkPermission(userEmail, ['admin']);
  
  try {
    // Kiểm tra email trùng
    var sheet = getSheet('Users');
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][1].toString().toLowerCase() === userData.email.toLowerCase()) {
        return { success: false, error: 'Email đã tồn tại trong hệ thống!' };
      }
    }
    
    // Tạo User_ID mới
    var userId = generateUserId();
    
    sheet.appendRow([
      userId,
      userData.email,
      userData.password || '123456', // Mật khẩu mặc định
      userData.fullName,
      userData.role,
      true  // Active mặc định
    ]);
    
    return { success: true, message: 'Thêm người dùng thành công! Mã: ' + userId };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Cập nhật user — Chỉ admin
 */
function updateUser(userData, userEmail) {
  checkPermission(userEmail, ['admin']);
  
  try {
    var sheet = getSheet('Users');
    var data = sheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString() === userData.userId) {
        sheet.getRange(i + 1, 4).setValue(userData.fullName);
        sheet.getRange(i + 1, 5).setValue(userData.role);
        sheet.getRange(i + 1, 6).setValue(userData.active);
        
        // Cập nhật password nếu có
        if (userData.password && userData.password.trim() !== '') {
          sheet.getRange(i + 1, 3).setValue(userData.password);
        }
        
        return { success: true, message: 'Cập nhật người dùng thành công!' };
      }
    }
    return { success: false, error: 'Không tìm thấy người dùng: ' + userData.userId };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Tạo mã user mới tự động
 */
function generateUserId() {
  try {
    var sheet = getSheet('Users');
    var data = sheet.getDataRange().getValues();
    var maxNum = 0;
    for (var i = 1; i < data.length; i++) {
      var id = data[i][0].toString();
      var num = parseInt(id.replace('U', ''));
      if (num > maxNum) maxNum = num;
    }
    var newNum = maxNum + 1;
    return 'U' + ('000' + newNum).slice(-3);
  } catch (e) {
    return 'U001';
  }
}
