const API_URL = import.meta.env.VITE_API_URL || '';

// Product interfaces
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  rating: number;
  in_stock: boolean;
  inventory_count: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface ProductsResponse {
  products: Product[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

interface CreateOrderData {
  items: any[];
  customerInfo: any;
  shippingInfo: any;
  totals: {
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
  };
  paymentMethod: string;
}

interface OrderResponse {
  success: boolean;
  orderId: string;
  paymentIntentId?: string;
  clientSecret?: string;
  message?: string;
}

// Create order
export const createOrder = async (orderData: CreateOrderData): Promise<OrderResponse> => {
  try {
    const response = await fetch(`${API_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Get order by ID
export const getOrder = async (orderId: string) => {
  try {
    const response = await fetch(`${API_URL}/api/orders/${orderId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
};

// Update order status
export const updateOrderStatus = async (orderId: string, status: string) => {
  try {
    const response = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

// Send confirmation email
export const sendConfirmationEmail = async (orderId: string, email: string) => {
  try {
    const response = await fetch(`${API_URL}/api/email/confirmation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderId, email }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    throw error;
  }
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await fetch(`${API_URL}/api/health`);
    return response.ok;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};

// Products API
export const getProducts = async (params?: {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<ProductsResponse> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params?.category && params.category !== 'all') {
      queryParams.append('category', params.category);
    }
    if (params?.search) {
      queryParams.append('search', params.search);
    }
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params?.offset) {
      queryParams.append('offset', params.offset.toString());
    }

    const url = `${API_URL}/api/products${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // Handle both old and new API formats
    if (Array.isArray(data)) {
      return {
        products: data,
        pagination: {
          total: data.length,
          limit: params?.limit || 50,
          offset: params?.offset || 0
        }
      };
    }
    return data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

export const getProduct = async (id: string): Promise<Product> => {
  try {
    const response = await fetch(`${API_URL}/api/products/${id}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
};

export const getProductCategories = async (): Promise<{categories: string[]}> => {
  try {
    const response = await fetch(`${API_URL}/api/products/meta/categories`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // Handle both old and new API formats
    if (Array.isArray(data)) {
      return { categories: data };
    }
    return data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

// Export Product interface for use in components
export type { Product, ProductsResponse };
