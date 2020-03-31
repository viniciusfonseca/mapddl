import { Model } from '../src'

export declare interface Customers {
    id: number
    name: string
    email: string
    phone: string
    role: string
    getAddress(): Promise<Addresses>
    setAddress(address: Addresses): Promise<any>
    getCarts(): Promise<Carts[]>
    addCart(cart: Partial<Carts>): Promise<Carts>
    removeCart(cart: Carts): Promise<any>
}

export declare interface Addresses {
    id: number
    street: string
    number: string
    city: string
    zip_code: string
    customer_id: number
}

export declare interface Products {
    id: number
    name: string
    price: number
    currency: string
}

export declare interface Carts {
    id: number
    customer_id: number
    getProducts(): Promise<Products[]>
    addProduct(product: Partial<Products>, relationshipParams?: Partial<CartsProducts>): Promise<Products>
    updateProduct(product: Partial<Products>, relationshipParams?: Partial<CartsProducts>): Promise<any>
    removeProduct(product: Products): Promise<any>
    getOrder(): Promise<Orders>
    setOrder(order: Orders): Promise<any>
}

export declare interface CartsProducts {
    cart_id: number
    product_id: number
    quantity: number
}

export declare interface Orders {
    id: number
    cart_id: number
    status: string
    description: string
}

export declare interface ModelDictionary {
    customers: Model<Customers>
    addresses: Model<Addresses>
    products: Model<Products>
    carts: Model<Carts>
    carts_products: Model<CartsProducts>
    orders: Model<Orders>
}