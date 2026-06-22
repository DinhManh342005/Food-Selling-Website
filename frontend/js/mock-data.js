const MOCK_PRODUCTS = [
  {
    id: 1,
    name: "Phở Bò Hà Nội",
    description: "Phở bò truyền thống Hà Nội với nước dùng trong, ngọt thanh từ xương ống, sợi phở mềm và thịt bò tái lăn thơm ngon.",
    imageUrl: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80",
    price: 65000,
    stockQuantity: 50,
    status: "available",
    averageRating: 4.8,
    createdAt: "2026-01-01T08:00:00Z",
    categoryId: 1,
    detailImages: [
      "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80"
    ]
  },
  {
    id: 2,
    name: "Bún Chả Hà Nội",
    description: "Thịt nướng thơm lừng ăn kèm nước chấm đu đủ xanh chua ngọt, bún tươi và rau sống thanh mát chuẩn vị Tràng An.",
    imageUrl: "https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=600&q=80",
    price: 55000,
    stockQuantity: 40,
    status: "available",
    averageRating: 4.7,
    createdAt: "2026-01-02T08:00:00Z",
    categoryId: 1,
    detailImages: []
  },
  {
    id: 3,
    name: "Bánh Chưng Đất Tổ",
    description: "Bánh chưng xanh gói bằng lá dong rừng, gạo nếp nương thơm dẻo, nhân đậu xanh và thịt ba chỉ béo ngậy đậm đà.",
    imageUrl: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=600&q=80",
    price: 120000,
    stockQuantity: 30,
    status: "available",
    averageRating: 4.9,
    createdAt: "2026-01-03T08:00:00Z",
    categoryId: 1,
    detailImages: []
  },
  {
    id: 4,
    name: "Cốm Vòng Hà Nội",
    description: "Cốm non làm từ lúa nếp non dẻo thơm, gói trong lá sen thơm ngát, giữ nguyên hương vị lúa mới mộc mạc.",
    imageUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80",
    price: 90000,
    stockQuantity: 20,
    status: "available",
    averageRating: 4.6,
    createdAt: "2026-01-04T08:00:00Z",
    categoryId: 1,
    detailImages: []
  },
  {
    id: 5,
    name: "Bún Bò Huế",
    description: "Bún bò Huế đậm đà hương mắm ruốc, sả, ăn kèm giò heo béo ngậy, thịt bò chín mềm và chả cua thơm ngon.",
    imageUrl: "https://images.unsplash.com/photo-1625398407796-82650a8c135f?auto=format&fit=crop&w=600&q=80",
    price: 60000,
    stockQuantity: 45,
    status: "available",
    averageRating: 4.9,
    createdAt: "2026-01-05T08:00:00Z",
    categoryId: 2,
    detailImages: []
  },
  {
    id: 6,
    name: "Mì Quảng Tôm Thịt",
    description: "Sợi mì Quảng vàng dai ngon ăn cùng tôm rim, thịt xá xíu đậm đà, bánh tráng nướng giòn rụm và nước nhưn cô đặc.",
    imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80",
    price: 45000,
    stockQuantity: 35,
    status: "available",
    averageRating: 4.7,
    createdAt: "2026-01-06T08:00:00Z",
    categoryId: 2,
    detailImages: []
  },
  {
    id: 7,
    name: "Cao Lầu Hội An",
    description: "Cao lầu Hội An đặc sản danh tiếng với sợi mì làm bằng nước giếng Bá Lễ, thịt xíu thơm lừng và tóp mỡ giòn rụm.",
    imageUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80",
    price: 50000,
    stockQuantity: 25,
    status: "available",
    averageRating: 4.8,
    createdAt: "2026-01-07T08:00:00Z",
    categoryId: 2,
    detailImages: []
  },
  {
    id: 8,
    name: "Trà Cung Đình Huế",
    description: "Trà thảo mộc cung đình Huế được kết hợp từ nhiều loại thảo dược quý hiếm, giúp thanh nhiệt, ngủ ngon và bồi bổ sức khỏe.",
    imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80",
    price: 85000,
    stockQuantity: 60,
    status: "available",
    averageRating: 4.5,
    createdAt: "2026-01-08T08:00:00Z",
    categoryId: 2,
    detailImages: []
  },
  {
    id: 9,
    name: "Cơm Tấm Sườn Bì Chả",
    description: "Cơm tấm dẻo hạt ăn kèm sườn heo nướng mật ong vàng ruộm, bì dai giòn, chả trứng béo bùi và nước mắm kẹo tỏi ớt.",
    imageUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=600&q=80",
    price: 50000,
    stockQuantity: 55,
    status: "available",
    averageRating: 4.9,
    createdAt: "2026-01-09T08:00:00Z",
    categoryId: 3,
    detailImages: []
  },
  {
    id: 10,
    name: "Hủ Tiếu Nam Vang",
    description: "Hủ tiếu Nam Vang với nước lèo tôm mực ngọt lịm, kèm trứng cút, lòng heo thơm giòn và tôm sú tươi ngọt.",
    imageUrl: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80",
    price: 55000,
    stockQuantity: 40,
    status: "available",
    averageRating: 4.7,
    createdAt: "2026-01-10T08:00:00Z",
    categoryId: 3,
    detailImages: []
  },
  {
    id: 11,
    name: "Bánh Pía Sầu Riêng",
    description: "Bánh Pía Sóc Trăng nhân sầu Riêng tươi kết hợp đậu xanh dẻo mịn và lòng đỏ trứng muối bùi béo.",
    imageUrl: "https://images.unsplash.com/photo-1608220179579-39948780defb?auto=format&fit=crop&w=600&q=80",
    price: 75000,
    stockQuantity: 100,
    status: "available",
    averageRating: 4.8,
    createdAt: "2026-01-11T08:00:00Z",
    categoryId: 3,
    detailImages: []
  },
  {
    id: 12,
    name: "Lẩu Mắm Miền Tây",
    description: "Lẩu mắm chuẩn vị Nam Bộ thơm nồng mùi mắm cá sặc cá linh, ăn kèm vô vàn loại rau đồng nội miền sông nước.",
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80",
    price: 250000,
    stockQuantity: 15,
    status: "available",
    averageRating: 4.6,
    createdAt: "2026-01-12T08:00:00Z",
    categoryId: 3,
    detailImages: []
  }
];

// Dữ liệu mẫu bổ sung cho Đơn hàng và Người dùng để bổ trợ hệ thống quản trị
const MOCK_ORDERS = [
  {
    id: "DH-1001",
    customerName: "Nguyễn Văn A",
    phone: "0901234567",
    address: "123 Đường Láng, Đống Đa, Hà Nội",
    paymentMethod: "COD",
    totalAmount: 185000,
    status: "delivered", // pending, processing, shipping, delivered, cancelled
    createdAt: "2026-06-10T14:30:00Z",
    items: [
      { productId: 1, name: "Phở Bò Hà Nội", price: 65000, quantity: 2 },
      { productId: 2, name: "Bún Chả Hà Nội", price: 55000, quantity: 1 }
    ]
  },
  {
    id: "DH-1002",
    customerName: "Trần Thị B",
    phone: "0912345678",
    address: "456 Lê Lợi, Quận 1, TP. Hồ Chí Minh",
    paymentMethod: "BANK_TRANSFER",
    totalAmount: 220000,
    status: "delivering",
    createdAt: "2026-06-13T09:15:00Z",
    items: [
      { productId: 9, name: "Cơm Tấm Sườn Bì Chả", price: 50000, quantity: 2 },
      { productId: 3, name: "Bánh Chưng Đất Tổ", price: 120000, quantity: 1 }
    ]
  },
  {
    id: "DH-1003",
    customerName: "Lê Văn C",
    phone: "0934567890",
    address: "789 Hùng Vương, Hải Châu, Đà Nẵng",
    paymentMethod: "COD",
    totalAmount: 105000,
    status: "pending",
    createdAt: "2026-06-14T02:00:00Z",
    items: [
      { productId: 5, name: "Bún Bò Huế", price: 60000, quantity: 1 },
      { productId: 6, name: "Mì Quảng Tôm Thịt", price: 45000, quantity: 1 }
    ]
  }
];

