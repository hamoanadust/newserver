Api

A. User:
    1. POST /user/signup
        req.body: {
            data: {
                username: 'newuser',
                password: '123456'
            }
        }
        res: 
        Success:{success: true}
        Fail:   {success: false, message: 'username already existed'}
    2. POST /user/signin
        req.body: {
            data: {
                username: 'newuser,
                password: '123456'
            }
        }
        res: 
        Success:	
            {success: true, message: 'signin success', token};  
            store token in browser, add to header with {Authorization: 'Bear' + token}
        Fail:	
            1.	{success: false, message: 'password incorrect'};
            2.	{success: false, message: 'username does not exist'};
    3. POST /user/change_password
        req.body: {
            data: {
                username: 'newuser',
                old_password: '123456'
                new_password: '1234567'
            }
        }
        res: 
        Success: {success: true};
        Fail: 	
            1.	{success: false, message: 'username does not exist'};
            2.	{success: false, message: 'old password incorrect'};
    4. POST /user/check_user_token
        req.body: {
        }
        res: 
        Success:{success: true};
        Fail:   {success: false, message: 'unauthorized'};

B. Season
    1. POST /season/find_season
        req.body: {
            data: {
                card_type: 'IU',
                card_number: 'U000001121234567'
            }
        }
        or
        req.body: {
            data: {
                vehicle_number: 'SAA0000A'
            }
        }
        res: 
        Success:{success: true, data: season found}
        Fail:   {success: false, message: error message}
    2. POST /season/add_season                          this is for admin add season
        req.body: {
            data: {
                carpark_id: 1,                          required
                card_number: "U000001121234567",        required
                start_date: '2019-12-01',               required
                end_date: '2020-01-31',                 required
                card_type: "IU",                        default IU, options: CASHCARD
                vehicle_type: 'CAR',                    default CAR, options: MOTOR, LORRY
                holder_type: 'TENANT'                   default TENANT, options: PUBLIC
                attn: 'system',                         default system, options: any value
                vehicle_id: 12,                         if have a vehicle in system, can provide vehicle_id
                vehicle_number: "SAA0000A",             if no vehicle_id in system, can provide vehicle_number
                holder_id: 1,                           if holder in system, can provide user_id as holder_id
                holder_name: 'Sam',                     if holder not in system, can provide user info
                holder_company_name: 'ABC company',     if holder not in system, can provide user info
                holder_address: 'smith road',           if holder not in system, can provide user info
                holder_contact_number: '81818181',      if holder not in system, can provide user info
                holder_email: 'test@test.com'           if holder not in system, can provide user info
            }
        }
        res: 
        Success:{success: true, data: season added}
        Fail:   {success: false, message: error message}
    3. POST /season/add_season_with_invoice             this is for user purchase season
        req.body: {
            data: {
                [all data from add_season]
                invoice_type: 'NEW',                    default NEW, options: RENEW
            }
        }
        res: 
        Success:{success: true, data: season, invoice, invoice_item added}
        Fail:   {success: false, message: error message}
    4. POST /season/list_season                       this is for client list his own seasons
        req.body: {
            data: {
                limit: 50,
                offset: 10,
                orderby: 'start_date',
                orderdirection: 'desc
            }
        }
        res: 
        Success:{success: true, data: seasons found}
        Fail:   {success: false, message: error message}
    5. POST /season/list_season_for_admin               this is for admin list season on certain condition
        req.body: {
            data: {
                condition: {
                    fields: [                           default null, will select all
                        'holder_name', 
                        'holder_address'
                    ],
                    where: {
                        whereand: {
                            start_date: {
                                gt: '2019-01-01',
                                lte: '2019-10-31'
                            },
                            whereor: {
                                status: ['TERMINATED', 'EXPIRED'],
                                holder_type: 'TENANT'
                            },
                            vehicle_type: 'MOTOR'
                        }
                    },
                    limit: 50,                          default 100, if don't want limit, set limit = 'no'
                    offset: 20,                         default 0
                    orderby: 'start_date',              default season_id
                    orderdirection: 'asc'               default desc
                }
            }
        }
        this search condition = `select holder_name, holder_address from season where vehicle_type = 'MOTOR' and start_date > '2019-01-01' and start_date <= '2019-10-31' and (status in ('TERMINATED', 'EXPIRED') or holder_type = 'TENANT') order by start_date asc limit 50 offset 20;`
        res: 
        Success:{success: true, data: season data apply with this condition}
        Fail:   {success: false, message: error message}
C. Invoice
    1. POST /invoice/find_invoice                       this is for client find his own invoice, only one will be found
        req.body: {
            data: {
                invoice_id: 12
            }
        }
        or
        req.body: {
            data: {
                invoice_number: 'INV/000012/2019'
            }
        }
        res: 
        Success:{success: true, data: invoice found}
        Fail:   {success: false, message: error message}
    2. POST /invoice/list_invoice                       this is for client list his own invoices
        req.body: {
            data: {
                limit: 50,
                offset: 10,
                orderby: 'invoice_date',
                orderdirection: 'desc
            }
        }
        res: 
        Success:{success: true, data: invoices found}
        Fail:   {success: false, message: error message}
    3. POST /invoice/list_invoice_for_admin             this is for admin list invoices by condition
        req.body: {
            data: {
                condition: {
                    where: {
                        whereand, whereand
                    }
                    limit
                    offset
                    orderby
                    orderdirection
                }
            }
        }
        condition is the same structure with list_season_for_admin
        res: 
        Success:{success: true, data: invoices found}
        Fail:   {success: false, message: error message}
    4. POST /invoice/create_invoice                     this is for admin to create invoice
        req.body: {
            data: {
                invoice_item: [                         required, at least provide one item, 
                    {
                        season_id,                      required, which season this item is for
                        unit_price,                     required, season rate
                        quantity                        required, how many month
                    }
                ],
                carpark_id: 1,                          if carpark in system, can provide carpark_id
                carpark_name,                           if carpark not in system, can provide carpark name
                carpark_address,                        if carpark not in system, can provide carpark address
                buyer_id,                               if buyer in system, can provide user_id as buyer_id
                buyer_name,                             if buyer not in system, can provide user info
                buyer_company,                          if buyer not in system, can provide user info
                buyer_address,                          if buyer not in system, can provide user info
                buyer_email,                            if buyer not in system, can provide user info
                buyer_contact_number,                   if buyer not in system, can provide user info
                invoice_type,                           default NEW, options: RENEW
                attn,                                   default system, options: any value
                invoice_date,                           default today, options: any date provided
            }
        }
        one invoice have multiple invoice_item, each invoice_item is tied to one season
        invoice amount is every invoice_item's amount added together
        res:
        Success:{success: true, data: invoice created}
        Fail:   {success: false, message: error message}
D. Vehicle
    1. POST /vehicle/add_vehicle                       this is for client to add vehicle
        req.body: {
            data: {
                vehicle_number,                         required
                card_number,                            required
                card_type                               default IU
            }
        }
        res: 
        Success:{success: true}
        Fail:   {success: false, message: error message}
    2. POST /vehicle/list_vehicle                       this is for client to list his own vehicles
        req.body: {
        }
        res: 
        Success:{success: true, data: vehicles found}
        Fail:   {success: false, message: error message}
    3. POST /vehicle/list_vehicle_for_admin             this is for admin to list vehicles by condition
        req.body: {
            data: {
                condition                               same structure with list_season_for_admin
            }
        }
        res: 
        Success:{success: true, data: vehicles found}
        Fail:   {success: false, message: error message}
D. Carpark
    1. POST /carpark/list_carpark                       this is for client to list carpark
        req.body: {
            data: {
                vehicle_number,                         required
                card_number,                            required
                card_type                               default IU
            }
        }
        res: 
        Success:{success: true}
        Fail:   {success: false, message: error message}
E. Payment
    1. GET /bt/create_checkout                          this is for checkout dropin
        res: checkout html
    2. GET /bt/save_customer                            this is for remember credit card payment method
        res: save_customer html